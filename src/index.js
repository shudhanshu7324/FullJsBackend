
import 'dotenv/config'
import connectDb from './db/index.js'

// anytime using database there is a chance that we get some errors so always use try or catch or promise (resolve,reject)
// always use async await for database connection because it is in another continents takes time to fetch data.

connectDb();


// mongodb connection using iife
/*
;(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
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