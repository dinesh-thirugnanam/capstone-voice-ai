import { UserDAL } from "../dal/UserDal.ts";

export class UserService {
    constructor(private dal: UserDAL = new UserDAL()) {}

    getAllUsers = async () => await this.dal.getAllUsers();

    createUser = async (user: {
        id: string;
        name: string;
        email: string;
        role: string;
    }) => await this.dal.createUser(user);

    updateUser = async (id: string, payload: Record<string, any>) =>
        await this.dal.updateUser(id, payload);

    deleteUser = async (id: string) => await this.dal.deleteUser(id);
}
