import prisma from "@/lib/prisma";
import { storage, ID } from "@/lib/appwrite";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Buffer } from "buffer";

const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;

const fmt = (n: number) => {
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
  return `INR ${formatted}`;
};

const BILL_TYPE_LABELS: Record<string, string> = {
  REGISTRATION: "Registration",
  TRAVEL: "Travel",
  ACCOMMODATION: "Accommodation",
  HARDWARE: "Hardware",
  SUBSCRIPTION: "Subscription",
  OTHER: "Other",
};

export async function regenerateMasterPdf(grantId: string) {
    if (!BUCKET_ID) throw new Error("Bucket ID not configured");

    // 1. Fetch Approved Bills
    const acceptedBills = await prisma.grantInBill.findMany({
        where: {
            grantInId: grantId,
            billStatus: "ACCEPTED",
            isMasterPdf: false
        },
        include: {
            user: true,
            grantIn: true
        },
        orderBy: {
            billDate: 'asc'
        }
    });

    // 2. Fetch Existing Master PDF
    const existingMaster = await prisma.grantInBill.findFirst({
        where: {
            grantInId: grantId,
            isMasterPdf: true
        }
    });

    // If no accepted bills, ensure Master is deleted and return
    if (acceptedBills.length === 0) {
        if (existingMaster) {
            try {
                await storage.deleteFile(BUCKET_ID, existingMaster.fileId);
            } catch (e) {
                console.warn("Failed to delete master file from Appwrite:", e);
            }
            await prisma.grantInBill.delete({ where: { id: existingMaster.id } });
        }
        return;
    }

    // 3. Create Master PDF
    const masterDoc = await PDFDocument.create();
    const helveticaFont = await masterDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await masterDoc.embedFont(StandardFonts.HelveticaBold);

    // Pre-calculate page ranges and cache file data in memory
    let currentPage = 1; // Cover page is Page 1
    const billPageRanges: Array<{
        bill: typeof acceptedBills[0];
        startPage: number;
        endPage: number;
        fileBytes: Buffer | null;
        billDoc: PDFDocument | null;
        isPdf: boolean;
        isImage: boolean;
    }> = [];

    for (let i = 0; i < acceptedBills.length; i++) {
        const bill = acceptedBills[i];
        let billPageCount = 1;
        let fileBytes: Buffer | null = null;
        let billDoc: PDFDocument | null = null;
        let isPdf = false;
        let isImage = false;

        try {
            const fileViewUrl = storage.getFileView(BUCKET_ID, bill.fileId);
            const response = await fetch(fileViewUrl.toString());
            if (!response.ok) throw new Error(`Failed to fetch file: ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            fileBytes = Buffer.from(arrayBuffer);

            const isJpeg = fileBytes[0] === 0xFF && fileBytes[1] === 0xD8;
            const isPng  = fileBytes[0] === 0x89 && fileBytes[1] === 0x50 && fileBytes[2] === 0x4E && fileBytes[3] === 0x47;
            // CORRECT PDF MAGIC BYTES: 0x25 0x50 0x44 0x46 (%PDF)
            isPdf = fileBytes[0] === 0x25 && fileBytes[1] === 0x50 && fileBytes[2] === 0x44 && fileBytes[3] === 0x46;
            isImage = isJpeg || isPng;

            if (isPdf) {
                billDoc = await PDFDocument.load(fileBytes);
                billPageCount = billDoc.getPageCount();
            }
        } catch (error) {
            console.error(`Failed to pre-process bill ${bill.id}:`, error);
        }

        const startPage = currentPage + 1;
        const endPage = currentPage + billPageCount;
        billPageRanges.push({
            bill,
            startPage,
            endPage,
            fileBytes,
            billDoc,
            isPdf,
            isImage
        });
        currentPage = endPage;
    }

    // Cover Page
    const coverPage = masterDoc.addPage();
    const { height } = coverPage.getSize();
    const projectCode = acceptedBills[0].grantIn.projectCode || "N/A";
    const totalAmount = acceptedBills.reduce((sum: number, b: any) => sum + (b.amount || 0), 0);

    coverPage.drawText(`Innovation & Entrepreneurship Development Cell (IEDC)`, {
        x: 50, y: height - 60, size: 10, font: helveticaBold, color: rgb(0.4, 0.4, 0.4)
    });
    coverPage.drawLine({
        start: { x: 50, y: height - 70 },
        end: { x: 545, y: height - 70 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
    });

    coverPage.drawText(`GRANT MASTER BILL REPORT`, {
        x: 50, y: height - 110, size: 24, font: helveticaBold, color: rgb(0.1, 0.2, 0.4)
    });

    coverPage.drawText(`Project Name (Code): ${projectCode}`, {
        x: 50, y: height - 150, size: 13, font: helveticaBold, color: rgb(0.2, 0.2, 0.2)
    });
    
    coverPage.drawText(`Generated Date: ${new Date().toLocaleDateString("en-IN")}`, {
        x: 50, y: height - 175, size: 11, font: helveticaFont, color: rgb(0.4, 0.4, 0.4)
    });
    coverPage.drawText(`Total Sanctioned Budget: ${acceptedBills[0].grantIn.amountGranted ? fmt(acceptedBills[0].grantIn.amountGranted) : "N/A"}`, {
        x: 50, y: height - 200, size: 11, font: helveticaFont, color: rgb(0.4, 0.4, 0.4)
    });
    coverPage.drawText(`Total Claimed Amount: ${fmt(totalAmount)}`, {
        x: 50, y: height - 225, size: 12, font: helveticaBold, color: rgb(0.1, 0.6, 0.2)
    });
    coverPage.drawText(`Total Bills Approved: ${acceptedBills.length}`, {
        x: 50, y: height - 250, size: 11, font: helveticaFont, color: rgb(0.4, 0.4, 0.4)
    });

    // Draw Expense Item Index title
    coverPage.drawText(`Expense Index Table`, {
        x: 50, y: height - 300, size: 14, font: helveticaBold, color: rgb(0.1, 0.2, 0.4)
    });

    let currentY = height - 330;
    const tableX = 50;
    const colWidths = [40, 110, 100, 100, 100]; // Bill #, Type, Amount, Date, Pages
    const tableWidth = colWidths.reduce((sum, w) => sum + w, 0);

    // Draw header background
    coverPage.drawRectangle({
        x: tableX,
        y: currentY - 20,
        width: tableWidth,
        height: 20,
        color: rgb(0.1, 0.2, 0.4), // Dark slate blue
    });

    // Draw header labels
    const headers = ["Bill #", "Expense Type", "Amount", "Date", "Page Range"];
    let currentX = tableX;
    for (let col = 0; col < headers.length; col++) {
        coverPage.drawText(headers[col], {
            x: currentX + 6,
            y: currentY - 14,
            size: 9,
            font: helveticaBold,
            color: rgb(1, 1, 1),
        });
        currentX += colWidths[col];
    }

    currentY -= 20;

    // Draw rows
    for (let r = 0; r < billPageRanges.length; r++) {
        const item = billPageRanges[r];
        const { bill, startPage, endPage } = item;

        // Alternate background
        if (r % 2 === 1) {
            coverPage.drawRectangle({
                x: tableX,
                y: currentY - 20,
                width: tableWidth,
                height: 20,
                color: rgb(0.95, 0.96, 0.98),
            });
        }

        // Draw row values
        const rowVals = [
            `#${r + 1}`,
            (bill.billType === "OTHER" && bill.customBillType)
                ? bill.customBillType
                : (BILL_TYPE_LABELS[bill.billType] || bill.billType),
            bill.amount != null ? fmt(bill.amount) : "N/A",
            new Date(bill.billDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
            startPage === endPage ? `Page ${startPage}` : `Pages ${startPage} - ${endPage}`
        ];

        let cellX = tableX;
        for (let col = 0; col < rowVals.length; col++) {
            coverPage.drawText(rowVals[col], {
                x: cellX + 6,
                y: currentY - 14,
                size: 8,
                font: helveticaFont,
                color: rgb(0.2, 0.2, 0.2),
            });
            cellX += colWidths[col];
        }

        // Draw horizontal bottom border
        coverPage.drawLine({
            start: { x: tableX, y: currentY - 20 },
            end: { x: tableX + tableWidth, y: currentY - 20 },
            thickness: 0.5,
            color: rgb(0.85, 0.85, 0.85),
        });

        currentY -= 20;
    }

    // Merge pages of each bill
    for (let i = 0; i < billPageRanges.length; i++) {
        const item = billPageRanges[i];
        const { bill, startPage, endPage, fileBytes, billDoc, isPdf, isImage } = item;

        if (!fileBytes) {
            // Fetch/read failed — add error page
            const errPage = masterDoc.addPage();
            errPage.drawText(`Error loading Bill #${i+1} (ID: ${bill.id})`, { x: 50, y: 700, size: 20, color: rgb(1, 0, 0) });
            continue;
        }
        
        try {
            const stampText = `Bill #${i + 1} | Date: ${new Date(bill.billDate).toLocaleDateString("en-IN")} | Amount: ${bill.amount != null ? fmt(bill.amount) : 'N/A'}`;
            const uploaderText = `Uploaded By: ${bill.user.name ?? 'Unknown'} (${bill.user.email ?? 'No Email'})`;

            if (isPdf && billDoc) {
                const copiedPages = await masterDoc.copyPages(billDoc, billDoc.getPageIndices());

                for (const page of copiedPages) {
                    const { width: pWidth, height: pHeight } = page.getSize();
                    
                    page.drawText(stampText, {
                        x: 20, y: pHeight - 20, size: 10,
                        font: helveticaBold, color: rgb(1, 0, 0)
                    });
                    page.drawText(uploaderText, {
                        x: 20, y: 20, size: 8,
                        font: helveticaFont, color: rgb(0.5, 0.5, 0.5)
                    });
                    page.drawText(`VERIFIED & APPROVED BY PI/CO-PI`, {
                        x: pWidth - 200, y: 20, size: 8,
                        font: helveticaBold, color: rgb(0, 0.6, 0)
                    });

                    masterDoc.addPage(page);
                }
            } else if (isImage) {
                // Embed image as a full page
                const embeddedImage = bill.billType === "OTHER" // fallback logic
                    ? await masterDoc.embedJpg(fileBytes).catch(() => masterDoc.embedPng(fileBytes))
                    : await masterDoc.embedJpg(fileBytes).catch(() => masterDoc.embedPng(fileBytes));

                const imgPage = masterDoc.addPage();
                const { width: pWidth, height: pHeight } = imgPage.getSize();
                const margin = 40;
                const maxW = pWidth - margin * 2;
                const maxH = pHeight - margin * 2 - 40; // leave room for stamp

                const scale = Math.min(maxW / embeddedImage.width, maxH / embeddedImage.height, 1);
                const imgW = embeddedImage.width * scale;
                const imgH = embeddedImage.height * scale;

                imgPage.drawImage(embeddedImage, {
                    x: (pWidth - imgW) / 2,
                    y: margin,
                    width: imgW,
                    height: imgH,
                });
                imgPage.drawText(stampText, {
                    x: 20, y: pHeight - 20, size: 10,
                    font: helveticaBold, color: rgb(1, 0, 0)
                });
                imgPage.drawText(uploaderText, {
                    x: 20, y: 10, size: 8,
                    font: helveticaFont, color: rgb(0.5, 0.5, 0.5)
                });
            } else {
                // Unknown format — add a notice page
                const noticePage = masterDoc.addPage();
                const { height: pH } = noticePage.getSize();
                noticePage.drawText(`Bill #${i + 1}: Unsupported file format`, {
                    x: 50, y: pH - 100, size: 16, font: helveticaBold, color: rgb(1, 0, 0)
                });
                noticePage.drawText(`File ID: ${bill.fileId}`, {
                    x: 50, y: pH - 130, size: 12, font: helveticaFont
                });
            }

        } catch (error) {
            console.error(`Failed to merge bill ${bill.id}:`, error);
            const errPage = masterDoc.addPage();
            errPage.drawText(`Error rendering Bill #${i+1} (ID: ${bill.id})`, { x: 50, y: 700, size: 18, color: rgb(1, 0, 0) });
        }
    }

    // Save Master PDF
    const pdfBytes = await masterDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    // 4. Upload New Master
    const fileObj = new File([pdfBuffer], `master_${grantId}_${Date.now()}.pdf`, { type: 'application/pdf' });
    const newFile = await storage.createFile(BUCKET_ID, ID.unique(), fileObj);
    const newFileUrl = await storage.getFileView(BUCKET_ID, newFile.$id);

    // 5. Update DB
    try {
        if (existingMaster) {
            await prisma.grantInBill.update({
                where: { id: existingMaster.id },
                data: {
                    fileId: newFile.$id,
                    fileUrl: newFileUrl.toString(),
                    billDate: new Date(), 
                    billStatus: "ACCEPTED",
                    updatedAt: new Date()
                }
            });
            
            try {
                await storage.deleteFile(BUCKET_ID, existingMaster.fileId);
            } catch (e) {
                console.warn("Failed to delete OLD master file, but new one is live:", e);
            }

        } else {
            const masterUserId = acceptedBills[0].userId; 
            
            await prisma.grantInBill.create({
                data: {
                    grantInId: grantId,
                    fileId: newFile.$id,
                    fileUrl: newFileUrl.toString(),
                    billStatus: "ACCEPTED",
                    isMasterPdf: true,
                    billDate: new Date(),
                    userId: masterUserId,
                    amount: null 
                }
            });
        }

    } catch (dbError) {
        console.error("DB Update failed, deleting orphaned Appwrite file:", newFile.$id);
        await storage.deleteFile(BUCKET_ID, newFile.$id).catch(e => console.error("Failed rollback:", e));
        throw dbError;
    }
}
