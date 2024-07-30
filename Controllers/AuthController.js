import UserModel from "../Models/User.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import otpGenerator from "otp-generator";
import uploadOnCloudinary from "../utils/cloudinary.js";

dotenv.config();

// Middleware to verify the email
export async function verifyEmail(req, res, next) {
  try {
    const { email } = req.method === "GET" ? req.query : req.body;
    // Check the email existence
    let exist = await UserModel.findOne({ email });
    if (!exist) {
      return res.status(404).send({ error: "Can't find Email" });
    }
    next();
  } catch (error) {
    return res.status(404).send({ error: "Authentication Error" });
  }
}

/** POST: http://localhost:8080/api/register 
{
    "email":"abc@gmail.com",
    "password":"1234"
}
 */

export async function register(req, res) {
  try {
    const { email, password } = req.body;

    //check email already exist
    const existingEmail = await UserModel.findOne({ email });
    if (existingEmail) {
      return res
        .status(400)
        .send({ error: "Email already exists. Please use a different one." });
    }

    if (!password) {
      return res.status(400).send({ error: "Password is required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new UserModel({
      password: hashedPassword,
      email,
    });

    // Save user to database
    const savedUser = await user.save();
    res.status(201).send({ msg: "User registered successfully" });
  } catch (error) {
    res.status(500).send({ error: `Registration failed: ${error.message}` });
  }
}

/** POST: http://localhost:8080/api/login 
{
    "email":"abc@gmail.com",
    "password":"1234"
}
 */
export async function login(req, res) {
  const { email, password } = req.body;
  try {
    UserModel.findOne({ email })
      .then((user) => {
        bcrypt
          .compare(password, user.password)
          .then((passwordCheck) => {
            if (!passwordCheck)
              return res.status(400).send({ error: "Don't have password" });
            //create JWT token
            const token = jwt.sign(
              {
                userId: user._id,
                email: user.email,
              },
              process.env.JWT_SECRET,
              { expiresIn: "24h" }
            );
            return res.status(200).send({
              msg: "Login Successful...!",
              email: user.email,
              token,
            });
          })
          .catch((error) => {
            return res.status(400).send({ error: "Password doesn't match" });
          });
      })
      .catch((error) => {
        return res.status(400).send({ error: "Email not found !" });
      });
  } catch (error) {
    return res.status(500).send({ error });
  }
}

/** GET: http://localhost:8080/api/user/abc@gmail.com */
export async function getUser(req, res) {
  const { email } = req.params; //{} means object destructuring

  // console.log(email);
  try {
    if (!email) return res.status(501).send({ error: "Invalid Email" });

    const user = await UserModel.findOne({ email });

    if (!user) {
      // console.warn(`User not found: ${email}`);
      return res.status(404).send({ error: "Couldn't find the user" });
    }

    //removed password from user
    //toJSON is for removing unnecessary data with object so convert it into JSON
    const { password, ...rest } = Object.assign({}, user.toJSON());
    // console.log(`User found: ${email}`);
    return res.status(201).send(rest);
  } catch (error) {
    return res.status(404).send({ error: "Cannot find User Data" });
  }
}

/** PUT: http://localhost:8080/api/updateuser 
 * @param: {
  "header" : "<token>"
}
body: {
    firstName: '',
    address : '',
    image : ''
}
*/
// Function to update user details
export async function updateUser(req, res) {
  try {
    const { userId } = req.user;

    if (userId) {
      const body = req.body;

      // If a file was uploaded, add its path to the body
      let image = req.body.image; // Keep old image if not replaced
      if (req.file) {
        const cloudinaryResponse = await uploadOnCloudinary(req.file.buffer);
        if (cloudinaryResponse) {
          image = cloudinaryResponse.url;
        } else {
          return res
            .status(500)
            .send({ error: "Error uploading image to Cloudinary" });
        }
      }

      const updatedData = { ...body, image };
      const result = await UserModel.updateOne({ _id: userId }, updatedData);

      if (result.nModified === 0) {
        return res
          .status(200)
          .send({ msg: "No changes detected, record remains the same" });
      }

      return res.status(201).send({ msg: "Record Updated!" });
    } else {
      return res.status(401).send({ error: "User ID not provided" });
    }
  } catch (error) {
    console.error("Error updating user:", error);
    return res
      .status(500)
      .send({ error: "An error occurred while updating the record" });
  }
}

/** GET: http://localhost:8080/api/generateOTP */
export async function generateOTP(req, res) {
  req.app.locals.OTP = await otpGenerator.generate(4, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  res.status(201).send({ code: req.app.locals.OTP });
}

/** GET: http://localhost:8080/api/verifyOTP */
export async function verifyOTP(req, res) {
  const { code } = req.query;
  if (parseInt(req.app.locals.OTP) === parseInt(code)) {
    req.app.locals.OTP = null; // reset the OTP value
    req.app.locals.resetSession = true; // start session for the reset password
    return res.status(201).send({ msg: "Verify Successfully" });
  }
  return res.status(400).send({ msg: "Invalid OTP" });
}

// successfully redirect user when OTP is valid
/** GET: http://localhost:8080/api/createResetSession */
export async function createResetSession(req, res) {
  if (req.app.locals.resetSession) {
    req.app.locals.resetSession = false; // allow access to this route only once
    return res.status(201).send({ msg: "access granted!" });
  }
  return res.status(440).send({ error: "Session Expired!" });
}

// update the password when we have valid session
/** PUT: http://localhost:8080/api/resetPassword */
export async function resetPassword(req, res) {
  try {
    if (!req.app.locals.resetSession)
      return res.status(440).send({ error: "Session Expired!" });
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send({ error: "Email and password are required" });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).send({ error: "Email not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await UserModel.updateOne(
      { email: user.email },
      { password: hashedPassword }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ error: "User not found" });
    }

    if (result.modifiedCount === 0) {
      return res
        .status(200)
        .send({ msg: "No changes detected, password remains the same" });
    }

    req.app.locals.resetSession = false; // allow access to this route only once
    return res.status(200).send({ msg: "Password updated successfully" });
  } catch (error) {
    return res.status(401).send({ error });
  }
}
