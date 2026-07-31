import { CalendarDays, PlusCircle } from "lucide-react";
import { ShiftBoard } from "@/components/shift-board";
import { ButtonLink } from "@/components/ui/button";

export default function FacilityShiftsPage() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Facility shift board</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Monitor open and filled coverage across your sites.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/facility/schedule" variant="secondary">
            <CalendarDays className="h-4 w-4" aria-hidden />
            Schedule calendar
          </ButtonLink>
          <ButtonLink href="/facility/shifts/new">
            <PlusCircle className="h-4 w-4" aria-hidden />
            Post shift
          </ButtonLink>
        </div>
      </div>
      <ShiftBoard
        basePath="/facility/shifts"
        showBillRate
        defaultStatus=""
      />
    </div>
  );
}
