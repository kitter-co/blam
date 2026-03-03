import { UserSchema } from "./models/user.ts";
import nodemailer from "nodemailer";

export async function assignTargets(): Promise<void> {
  const users = await UserSchema.find({});
  const shuffled = [...users].sort(() => Math.random() - 0.5);
  await Promise.all(
    shuffled.map((user, i) =>
      UserSchema.findByIdAndUpdate(user._id, {
        target: shuffled[(i + 1) % shuffled.length]._id,
      }),
    ),
  );
}
export async function blammo(user: string): Promise<void> {
  const fullUser = await UserSchema.findById(user);
  const targetUser = await UserSchema.findById(fullUser?.target?.toString());
  if (!fullUser || !targetUser) {
    return;
  }
  await UserSchema.findByIdAndUpdate(targetUser?._id, { alive: false });
  await UserSchema.findByIdAndUpdate(user, {
    target: targetUser.target,
    score: fullUser.score + 1,
    weekScore: fullUser.weekScore + 1,
  });
  console.log(targetUser);
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendEmail(
  to: string,
  title: string,
  content: string,
): Promise<void> {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: title,
    text: content,
  });
}
