import { EventDAL } from "../dal/EventDal.ts";

export class EventService {
    constructor(private dal: EventDAL = new EventDAL()) {}

    getAllEvents = async () => await this.dal.getAllEvents();

    createEvent = async (event: Record<string, any>) =>
        await this.dal.createEvent(event);

    deleteEvent = async (id: string) => await this.dal.deleteEvent(id);
}
