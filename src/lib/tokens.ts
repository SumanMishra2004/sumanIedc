import { v4 as uuidv4 } from "uuid";
import prisma from "@/lib/prisma";

export const generateVerificationToken = async (email: string) => {
  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hour expiration

  const existingToken = await prisma.verificationToken.findFirst({
    where: { identifier: email }
  });

  if (existingToken) {
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: existingToken.identifier,
          token: existingToken.token,
        }
      }
    });
  }

  const verificationToken = await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    }
  });

  return verificationToken;
};

export const generatePasswordResetToken = async (email: string) => {
  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hour

  const existingToken = await prisma.passwordResetToken.findFirst({
    where: { identifier: email }
  });

  if (existingToken) {
    await prisma.passwordResetToken.delete({
      where: {
        identifier_token: {
          identifier: existingToken.identifier,
          token: existingToken.token,
        }
      }
    });
  }

  const passwordResetToken = await prisma.passwordResetToken.create({
    data: {
      identifier: email,
      token,
      expires,
    }
  });

  return passwordResetToken;
};
