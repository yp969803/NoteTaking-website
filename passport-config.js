const { authenticate } = require('passport')
const localstrategy=require('passport-local').Strategy
const mongoose=require('mongoose')
 async function initialize(passport, getuserbyname,getuserbyid){
    const authenticateuser=async (username,password,done)=>{
       const user=await getuserbyname(username)             
       if(user==null){

        return done(null,false,{message:'No user with this username'})
       }
       try{
        
        
        if(user.password===password){
             console.log(user.id)
            return done(null,user)
        }
        else{
          console.log(user)
            return done(null,false,{message:'password incorrect'})
            
        }
       }
       catch(e){
        return done(e)
       }
    }
  passport.use(new localstrategy({
    usernameFeild:'username',
    passwordField:'password'
    
  },authenticateuser))
  passport.serializeUser((user,done)=>{
    return done(null,user.id)

  })
  passport.deserializeUser(async(id,done)=>{
    return done(null,await getuserbyid(id))
  }
  )
}

module.exports=initialize