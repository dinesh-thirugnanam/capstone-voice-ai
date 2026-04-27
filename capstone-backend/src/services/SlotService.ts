import { SlotDAL } from "../dal/SlotDal.ts";

export class SlotService {
    constructor(private dal: SlotDAL = new SlotDAL()) {}

    getAllSlots = async () => await this.dal.getAllSlots();

    createSlot = async (slot: Record<string, any>) =>
        await this.dal.createSlot(slot);

    deleteSlot = async (id: string) => await this.dal.deleteSlot(id);

    getSlotsByUser = async (id: string) => await this.dal.getSlotsByUser(id);

    getAvailableSlots = async () => await this.dal.getAvailableSlots();
}
