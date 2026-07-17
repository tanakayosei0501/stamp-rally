"use client";
import { useRouter } from "next/navigation";

type Props = {
  value: string;
};

export default function MonthSelector({ value }: Props) {
  const router = useRouter();

  return (
    <input
      type="month"
      value={value}
      onChange={(e) => router.push(`/goals?month=${e.target.value}`)}
      className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300 text-gray-600"
    />
  );
}
