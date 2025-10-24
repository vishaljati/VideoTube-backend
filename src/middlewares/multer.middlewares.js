import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp")
  },
  filename: function (req, file, cb) {

    cb(null, Date.now+'-'+file.originalname)
  }
})

export const upload = multer({ storage ,
  limits:{fileSize:10*1024*1024}, //10 MB
  fileFilter: (req,file,cb)=>{
    if(file.mimetype.startsWith('image/')||file.mimetype.startsWith('video/')){
       cb(null , true)
    }else{
      throw new Error("Image or Video Required");
      
    }
  }
 })