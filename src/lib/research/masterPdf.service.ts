import prisma from "@/lib/prisma";
import { storage, ID } from "@/lib/appwrite";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Buffer } from "buffer";

// Since "appwrite" package is universal, we might need a specific way to upload buffer in Node
// In "appwrite" >= 10, for Node.js, we can pass a Buffer if we use InputFile.fromBuffer
// But "InputFile" is not exported by "appwrite" main entry in some versions.
// However, let's try to use "appwrite" features.

const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;

export async function regenerateMasterPdf(grantId: string) {
    if (!BUCKET_ID) throw new Error("Bucket ID not configured");

    // 1. Fetch Accept Bills
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
            grantInId: grantId as string,
            isMasterPdf: true
        }
    });

    // If no accepted bills, ensure Master is deleted and return
    if (acceptedBills.length === 0) {
        if (existingMaster) {
            await storage.deleteFile(BUCKET_ID, existingMaster.fileId);
            await prisma.grantInBill.delete({ where: { id: existingMaster.id } });
        }
        return;
    }

    // 3. Create Master PDF
    const masterDoc = await PDFDocument.create();
    const helveticaFont = await masterDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await masterDoc.embedFont(StandardFonts.HelveticaBold);

    // Cover Page
    const coverPage = masterDoc.addPage();
    const { height } = coverPage.getSize();
    const projectCode = acceptedBills[0].grantIn.projectCode || "N/A";
    const totalAmount = acceptedBills.reduce((sum: number, b: any) => sum + (b.amount || 0), 0);

    coverPage.drawText(`Grant Master Bill Report`, {
        x: 50, y: height - 100, size: 30, font: helveticaBold, color: rgb(0, 0, 0)
    });
    coverPage.drawText(`Project Code: ${projectCode}`, {
        x: 50, y: height - 150, size: 20, font: helveticaFont
    });
    coverPage.drawText(`Generated Date: ${new Date().toLocaleDateString()}`, {
        x: 50, y: height - 180, size: 15, font: helveticaFont
    });
    coverPage.drawText(`Total Accepted Amount: ${totalAmount}`, {
        x: 50, y: height - 210, size: 15, font: helveticaBold
    });
    coverPage.drawText(`Total Bills: ${acceptedBills.length}`, {
        x: 50, y: height - 240, size: 15, font: helveticaFont
    });

    // Process each bill
    for (let i = 0; i < acceptedBills.length; i++) {
        const bill = acceptedBills[i];
        
        try {
            // Get the file view URL and fetch actual bytes
            const fileViewUrl = storage.getFileView(BUCKET_ID, bill.fileId)
            const response = await fetch(fileViewUrl.toString())
            if (!response.ok) throw new Error(`Failed to fetch file: ${response.status}`)
            const arrayBuffer = await response.arrayBuffer()
            const pdfBytes = Buffer.from(arrayBuffer)

            // Detect file type by magic bytes
            const isJpeg = pdfBytes[0] === 0xFF && pdfBytes[1] === 0xD8;
            const isPng  = pdfBytes[0] === 0x89 && pdfBytes[1] === 0x50 && pdfBytes[2] === 0x4E && pdfBytes[3] === 0x47;
            const isPdf  = pdfBytes[0] === 0x25 && pdfBytes[1] === 0x50 && pdfBytes[2] === 0x44 && pdfBytes[3] === 0x46; // %PDF

            const stampText = `Bill #${i + 1} | Date: ${new Date(bill.billDate).toLocaleDateString()} | Amount: ${bill.amount ?? 'N/A'}`;
            const uploaderText = `Uploaded By: ${bill.user.name ?? 'Unknown'} (${bill.user.email ?? 'No Email'})`;

            if (isPdf) {
                const billDoc = await PDFDocument.load(pdfBytes);
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
            } else if (isJpeg || isPng) {
                // Embed image as a full page
                const embeddedImage = isJpeg
                    ? await masterDoc.embedJpg(pdfBytes)
                    : await masterDoc.embedPng(pdfBytes);

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
            // Add a placeholder verified error page
            const errPage = masterDoc.addPage();
            errPage.drawText(`Error loading Bill #${i+1} (ID: ${bill.id})`, { x: 50, y: 700, size: 20, color: rgb(1, 0, 0) });
        }
    }

    // Save Master PDF
    const pdfBytes = await masterDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    // 4. Upload New Master
    // Use File object workaround for Appwrite
    const fileObj = new File([pdfBuffer], `master_${grantId}_${Date.now()}.pdf`, { type: 'application/pdf' });
    
    // We upload using ID.unique()
    const newFile = await storage.createFile(BUCKET_ID, ID.unique(), fileObj);
    
    // Get View URL
    // Wait, getFileView returns a URL object or string depending on SDK version?
    // In lib/appwrite.ts it uses getFileView(...).toString()
    const newFileUrl = await storage.getFileView(BUCKET_ID, newFile.$id);

    // 5. Update DB inside a transaction logic (conceptually)
    // Actually, Appwrite operations can't be rolled back easily in Prisma transaction.
    // So we do Appwrite first (upload new), then DB update. If DB update fails, we should ideally delete the new file.
    // But for simplicity/safety against data loss, we just proceed.
    
    // However, if strict consistency is needed:
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
            
            // Delete old file only after successful DB update
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
        // Rollback: Delete the newly uploaded file since DB update failed
        console.error("DB Update failed, deleting orphaned Appwrite file:", newFile.$id);
        await storage.deleteFile(BUCKET_ID, newFile.$id).catch(e => console.error("Failed rollback:", e));
        throw dbError; // Re-throw
    }
}
