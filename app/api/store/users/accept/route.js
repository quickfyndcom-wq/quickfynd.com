import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import StoreUser from "@/models/StoreUser";
import Store from "@/models/Store";
import admin from "firebase-admin";

export async function POST(request) {
  try {
    await connectDB();

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: "Missing invitation token" }, { status: 400 });
    }

    const invite = await StoreUser.findOne({ inviteToken: token }).lean();
    if (!invite) {
      return NextResponse.json({ error: "Invalid or already used invitation" }, { status: 404 });
    }

    if (invite.inviteExpiry && new Date(invite.inviteExpiry) < new Date()) {
      return NextResponse.json({ error: "Invitation has expired" }, { status: 410 });
    }

    if (invite.email && userEmail && invite.email.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json({ error: "This invitation is for a different email address" }, { status: 403 });
    }

    const updated = await StoreUser.findOneAndUpdate(
      { inviteToken: token },
      {
        status: invite.status === "approved" ? "approved" : "pending",
        userId,
        inviteToken: null,
        inviteExpiry: null,
      },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "Failed to accept invitation" }, { status: 400 });
    }

    // Also approve the Store for this user if it exists
    if (invite.storeId) {
      const existingStore = await Store.findById(invite.storeId);
      if (existingStore) {
        // Update existing store status
        await Store.findByIdAndUpdate(
          invite.storeId,
          { status: "approved" },
          { new: true }
        );
      } else {
        // Create store if it doesn't exist
        await Store.create({
          _id: invite.storeId,
          userId,
          status: "approved",
          storeName: `Store`,
        });
      }
    }

    return NextResponse.json({
      message: "Invitation accepted. You now have access to the store.",
      status: "approved",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
