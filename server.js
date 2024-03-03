import bodyParser from 'body-parser';
import express from 'express';
import mongoose from 'mongoose';
import jwt  from 'jsonwebtoken';

import dotenv from 'dotenv'
import {user, post} from './schema.js'

import bcrypt from "bcrypt";

//i have not added the .env file please add it on your end
// syntax ACCESS_TOKEN_SECRET = {your hex code}
dotenv.config()

const app = express();
const port = 3000;
const saltRounds = 10;

app.use(express.json())
app.use(bodyParser.urlencoded({extended: true}))


await mongoose.connect("mongodb://localhost/assignment");
async function main(){



    app.post("/register", async(req, res)=>{

        const {name, email, password} = req.body
        let  prevUserExists = await user.findOne({email: email})

        if(prevUserExists) return res.status(409).json({status: "Email already exists. Try Logging In"})
        
        let userdata

        bcrypt.hash(password, saltRounds, async(err, hash)=>{

            if(err){
                console.log('Error hashing password', err)
            }
            else{

                try{
                    userdata = await user.create({name: name, email: email, password: hash})
                }
                catch(e){
                    console.log(e)
                    res.sendStatus(503)
                }

                if(userdata) return res.status(200).json({status: "Success", data: userdata})

            }

            })       

    })

    app.post("/login", async(req, res)=>{

        const {email, password} = req.body
        let userdata
        try{
            userdata = await user.findOne({email: email})
            console.log(userdata)

        }
        catch(e){
            console.log(e)
        }
        
        
        if(!userdata){

           
             return res.status(404).json({message: 'No Users Found'})
        }
        else{
            const storedHashedPassword = userdata.password
            bcrypt.compare(password, storedHashedPassword, (err, result)=>{

                if(err){
                    console.log('Error comparing password', err)
                }
                else{

                    const payload = {
                        exp: Math.floor(Date.now()/1000) + 3600,
                        data: userdata._id,
                    }
                    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET)
                    return res.status(200).json({status: "success", token: accessToken})
                }

            } )

            
        }
        
    })

    function authenticateToken(req, res, next){
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split('test ')[1]
        if(token == null) return res.sendStatus(401)

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async(err, decoded)=>{
            if(err) return res.sendStatus(500).json({status: "failed", message: "Not Authenticated"})

            const userdata = await user.findOne({_id: decoded.data})
            req.user = userdata._id
            next()
        })

    }

    app.post("/posts", authenticateToken, async(req, res)=>{

            const postdata = req.body
            console.log(postdata)
            let currentpost
            try{
                currentpost = await post.create(postdata)
            }
            catch(e){
                console.log(e)
            }

            if(currentpost){
                res.status(200).json({status: 'Post Created', data: currentpost})
            }
            else{
                res.status(400).json({status: 'Error Creating Post'})
            }
            

    })

    app.put("/posts/:postId",authenticateToken, async(req, res)=>{
        const postID = req.params.postId
        const updateddata = req.body
        let updatedpost

        try{
            updatedpost = await post.updateOne({_id: postID}, {$set:  updateddata})
        }
        catch(e){
            console.log(e)
        }

        if(updatedpost){
            res.status(200).json({status: "Success"})
        }
        else{
            res.status(400).json({status: 'Error Updating Post'})
        }


    })

    app.delete("/posts/:postId", authenticateToken, async(req, res)=>{
        const postID = req.params.postId
      
           await post.deleteOne({_id: postID})
           .then(()=>res.status(200).json({status: "Successfully deleted"}))
           .catch(e=>console.log(e))


    })

    app.listen(port, ()=>{
        console.log("app is listening at port", port)
    })

}

main().catch(e=>console.log(e))