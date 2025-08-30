/* import bcrypt from "bcryptjs";
import User from "@/lib/models/User";
import { ConnectDB } from "@/lib/config/db";

export const signup = async ({name, email, password}: { name: string, email: string, password: string}) => {
    await ConnectDB();

    const existingUser = await User.findOne({email});
    if(existingUser){
        return {status: 400, message: "User already exists"};
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        name, 
        email,
        password: hashedPassword
    });

    return { status: 200, message: "User created successfully.", user}

} */