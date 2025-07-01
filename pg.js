const {Client}=require("pg")
const client=new Client({
    user:"postgres",
    host:"localhost",
    database:"postgres",
    port:5432,
    password:"romiko2009"
})

client.connect()
.then(()=>{console.log("connected to pg")})
.catch(()=>{
console.log("can't connect to pg")
})

module.exports={client}