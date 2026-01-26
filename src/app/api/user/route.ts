import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const role = searchParams.get("role"); // Optional: filter by role (STUDENT or FACULTY)
        const search = searchParams.get("search"); // Optional: search by name or email
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const skip = (page - 1) * limit;

        // Build the query filter
        const whereClause: any = role 
            ? { role: role.toUpperCase() as "STUDENT" | "FACULTY"} 
            : {
                OR: [
                    { role: "STUDENT" as const },
                    { role: "FACULTY" as const }
                ]
            };

        if (search) {
            const baseWhere = whereClause.role ? { role: whereClause.role } : whereClause.OR ? { OR: whereClause.OR } : {};
            whereClause.AND = [
                baseWhere,
                {
                    OR: [
                        { name: { contains: search, mode: "insensitive" as const } },
                        { email: { contains: search, mode: "insensitive" as const } }
                    ]
                }
            ];
            if (whereClause.role) delete whereClause.role;
            if (whereClause.OR) delete whereClause.OR;
        }

        // Get total count for pagination
        const totalCount = await prisma.user.count({
            where: whereClause
        });

        // Fetch users from database with pagination
        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                image: true,
            },
            orderBy: {
                name: "asc"
            },
            skip,
            take: limit
        });

        return NextResponse.json({
            success: true,
            data: users,
            count: users.length,
            total: totalCount,
            page,
            limit,
            hasMore: skip + users.length < totalCount
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to fetch users"
        }, { status: 500 });
    }
}