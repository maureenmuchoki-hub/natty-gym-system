import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("Please define the JWT_SECRET environment variable in .env.local");
}

export function generateToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      branch: user.branch ? user.branch.toString() : null,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}