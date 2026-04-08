import { EventDAL } from "../dal/EventDal.ts";
import { SlotDAL } from "../dal/SlotDal.ts";

export class MockService {
    constructor(
        private eventDal: EventDAL = new EventDAL(),
        private slotDal: SlotDAL = new SlotDAL(),
    ) {}

    getEventTable = async () => {
        return await this.eventDal.getAllEvents();
    };

    getAvailableAppointments = async () => {
        const slots = await this.slotDal.getAllSlots();
        // filter by is_booked = false if present
        return (slots || []).filter(
            (s: any) =>
                s.is_booked === false ||
                s.is_booked === null ||
                s.is_booked === undefined,
        );
    };
}
