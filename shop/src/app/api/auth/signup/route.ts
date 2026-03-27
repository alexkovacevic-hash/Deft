import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, phone, password } = parsed.data;

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Email or phone number is required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }
    }

    if (phone) {
      const existing = await prisma.user.findUnique({ where: { phone } });
      if (existing) {
        return NextResponse.json(
          { error: "An account with this phone already exists" },
          { status: 409 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const twoFactorSecret = authenticator.generateSecret();

    const user = await prisma.user.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        hashedPassword,
        twoFactorSecret,
        twoFactorEnabled: false,
      },
    });

    // Generate QR code for 2FA setup
    const otpauth = authenticator.keyuri(
      email || phone || user.id,
      "FujiPhotoShop",
      twoFactorSecret
    );
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

    return NextResponse.json({
      userId: user.id,
      twoFactorSecret,
      qrCode: qrCodeDataUrl,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
