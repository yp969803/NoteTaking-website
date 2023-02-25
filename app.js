const express=require('express')
const app=express()
const mongoose=require('mongoose')
const methodOverride=require('method-override')
const slugify=require('slugify')
const passport=require('passport')
const flash=require('express-flash')
const session=require('express-session')
const mongodbstore=require('connect-mongodb-session')(session)
app.set('view engine','ejs')
app.use(express.urlencoded({extended:false}))
app.use(methodOverride('_method'))
main().catch(err=>console.log(err))
async function main(){
    const Schema=mongoose.Schema
    await mongoose.connect('mongodb://127.0.0.1/blog');
    const userschema=new Schema({
        username:{
            type:String,
            required:true,
            unique:true
        },
        password:{
           type:String,
           min:4,
           required:true
        },
      
        
    })
    const articleschema=mongoose.Schema({
        title:{
            type:String,
            required:true,
    
        },
        createdAt:{
            type:Date,
            default:new Date,
        },
        
        description:String,
        slug:{
            type:String,
            required:true,
            unique:true,
            
        }
    
    })
    articleschema.pre('validate',function(next){
        if(this.title){
            this.slug=slugify(this.title,{lower:true,strict:true})
        }
        next()
    })
    const usermodel= mongoose.model('user',userschema);
    const store=new mongodbstore({
      uri: 'mongodb://127.0.0.1/blog',
      collection: 'mySessions'
    })
    app.use(flash())
    app.use(session({
        secret:'helloworld',
        resave:false,
        saveUninitialized:false,
        store:store,
        cookie:{
            maxAge:100*1000*3600*24
        }
    
    }))
    const initializepassport=require('./passport-config.js')


    initializepassport(
        passport,
        async(username)=>await usermodel.findOne({username:username}),
        async(id)=>await usermodel.findById(id)
    )
    app.use(passport.initialize())
    app.use(passport.session())
    
    const checkauthenticated=(req,res,next)=>{
            if(req.isAuthenticated()){
                return next()
            }
            res.redirect('/login')
        }
     const checknotauthenticated=(req,res,next)=>{
            if(req.isAuthenticated()){
                return res.redirect('/')
        }
            next()
        } 
    app.get('/',checkauthenticated,async(req,res)=>{
          let name=req.user.username
          req.name=name
          console.log(name)
          const Article=mongoose.model(name,articleschema)
          let articles=await Article.find().sort({createdAt:'desc'})
          res.render('index.ejs',{articles:articles,name:name})
    })
    app.get('/login',checknotauthenticated,(req,res)=>{
        req.session.isAuth=true
        res.render('login.ejs')
    })
    app.post('/login',checknotauthenticated,passport.authenticate('local',{
        successRedirect: '/',
        failureRedirect:'/login',
        failureFlash:true
       
       
    }))
    app.get('/register',checknotauthenticated,(req,res)=>{
        res.render('register.ejs',{name:'Please type a password of more than 4 characters'})
     })
     app.post('/register',checknotauthenticated,async (req,res)=>{
        try{
            const {username,password}=req.body
            
            let user=await usermodel.findOne({username: username});
            console.log(user)
            if(user){
                console.log(user)
                 res.render('register.ejs',{name:`${username} this username already exists`})
            }
            
           else{
            user=new usermodel({
                
                username:username,
                password:password,
                
            })
            
            await user.save()
            res.redirect('/login')
           }
        }
        catch(err){
            console.log(err)
         res.redirect('/register')
        }
        console.log(req.body)
        
     })
     app.get('/articles/new',(req,res)=>{
        let name=req.user.username
          req.name=name
          console.log(name)
          const Article=mongoose.model(name,articleschema)
        res.render('new.ejs',{article: new Article()})
    })
    app.post('/articles',async(req,res)=>{
        const{title,description}=req.body
        console.log(req.body)
        let name=req.user.username
        req.name=name
        console.log(name)
        const Article=mongoose.model(name,articleschema)
        let article=new Article({
          title:title,
          description:description
        })
        try{
          await article.save()
          res.redirect(`/articles/${article.slug}`)
        }
        catch(e){
          console.log(e)
          res.render('articles/new',{article:article})
        }
      })
      app.get('/articles/:slug',async (req,res)=>{
        let name=req.user.username
        req.name=name
        console.log(name)
        const Article=mongoose.model(name,articleschema)
        const article=await Article.findOne({slug:req.params.slug})
        if(article==null){
          res.redirect('/')
        }
        else{
          res.render('show.ejs',{article:article})
        }
    })
    app.get('/articles/edit/:id',async(req,res)=>{
        let name=req.user.username
        req.name=name
        console.log(name)
        const Article=mongoose.model(name,articleschema)
        let article=await Article.findById(req.params.id)
        res.render('edit.ejs',{article:article})
      })
      app.put('/articles/:id',async (req,res)=>{
        try{
          const {title,description}=req.body;
          let name=req.user.username
          req.name=name
          console.log(name)
          const Article=mongoose.model(name,articleschema)
        let article=await Article.findById(req.params.id)
        article.title=title
        article.description=description
        await article.save()
        res.redirect('/')
        }
        catch(e){
          res.redirect(`/articles/edit/${article.id}`)
        }
      })    
      app.delete('/articles/:id',async (req,res)=>{
        try{
            const {title,description}=req.body;
          let name=req.user.username
          req.name=name
          console.log(name)
          const Article=mongoose.model(name,articleschema)
        let article=await Article.findById(req.params.id)

        await article.delete()
        res.redirect('/')
        }
        catch(e){
          console.log(e)
          res.redirect('/')
        }
      })
     app.post('/logout', function(req, res, next) {
        req.logout(function(err) {
          if (err) { return next(err); }
          res.redirect('/');
        });
      });
     app.listen(80,()=>{
         console.log('app is started in port 80')
     })

}