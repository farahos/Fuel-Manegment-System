import mongoose from "mongoose";
import  {dburl}  from './config.js';

const conectBD = async() =>{
    try{
        await mongoose.connect(dburl,{
            useNewUrlParser: true,
            useUnifiedTopology: true

        }); 
    }catch(error) {
        console.log(`error ${error.message}`);

        process.exit(1);

    }
}
export default conectBD;
