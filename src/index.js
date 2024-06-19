
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import express from "express";
import 'dotenv/config'

// anytime using database there is a chance that we get some errors so always use try or catch or promise (resolve,reject)
// always use async await for database connection because it is in another continents takes time to fetch data.

const app = express();

/*

// mongodb connection using iife
;(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}`);
        app.on("ERROR in connecting with database: ",(error) => {
            console.log("ERROR: in connecting with database: ", error);
        });

        app.listen(process.env.PORT,()=>{
            console.log("server is running");
        })
    } catch (error) {
        console.log("Error", error);
    }
})()


*/