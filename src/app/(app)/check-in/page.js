import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/requireAuth";
import dbConnect from "@/lib/dbConnect";
import Member from "@/models/Member";
import Attendance from "@/models/Attendance";
import Branch from "@/models/Branch";
import CheckInPanel from "./CheckInPanel";

export default async function CheckInPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  await dbConnect();

  const members = await Member.find({ isActive: true })
    .populate("branch")
    .sort({ firstName: 1 })
    .lean();

  const openAttendance = await Attendance.find({ checkOutTime: null })
    .populate("member")
    .populate("branch")
    .sort({ checkInTime: -1 })
    .lean();

  const membersData = JSON.parse(JSON.stringify(members));
  const openAttendanceData = JSON.parse(JSON.stringify(openAttendance));

  return (
    <div className="min-h-screen bg-[var(--ng-bg)] px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-xs uppercase tracking-widest text-[var(--ng-text-muted)] hover:text-[var(--ng-accent)]"
          >
            ← Dashboard
          </Link>
          <h1 className="font-display text-4xl text-[var(--ng-accent)] mt-2">Check-in</h1>
        </div>

        <CheckInPanel members={membersData} initialOpenAttendance={openAttendanceData} />
      </div>
    </div>
  );
}