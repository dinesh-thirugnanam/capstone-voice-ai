import { AppointmentDAL } from "./../dal/AppointmentDal.ts";
export class AppointmentService {
    constructor(private dal: AppointmentDAL = new AppointmentDAL()) {}

    getAllAppointments = async () => await this.dal.getAllAppointments();
}
