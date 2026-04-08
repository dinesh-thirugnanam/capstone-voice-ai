import { UserDAL } from "../dal/UserDal.ts";

export class AuthService {
    constructor(private dal: UserDAL = new UserDAL()) {}

    login = async (email: string, password: string) => {
        const users = await this.dal.getAllUsers();
        const user = (users || []).find(
            (u: any) => u.email === email && u.password === password,
        );
        if (!user) return null;
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };
    };
}
