const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

exports.signUp = functions.https.onCall(async (req, res) => {
  const obj = {
    email: req.email,
    userID: req.userID,
  };

  await axios
    .post(
      `https://celie.bubbleapps.io/version-test/api/1.1/wf/signup`,
      JSON.stringify(obj),
      {
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          Authorization: `Bearer 2830d61fdf419466f737ce9889444aae`,
        },
      }
    )
    .catch((e) => console.log("ERROR", e));
});

exports.editExperience = functions.https.onCall(async (req, res) => {
  const obj = {
    userID: req.userID,
    tripID: req.tripID,
    experienceID: req.experienceID,
  };

  await axios
    .post(
      `https://celie.bubbleapps.io/version-test/api/1.1/wf/edit-experiences`,
      JSON.stringify(obj),
      {
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          Authorization: `Bearer 2830d61fdf419466f737ce9889444aae`,
        },
      }
    )
    .catch((e) => console.log("ERROR", e));
});

exports.getExperiences = functions.https.onCall(async (user) => {
  const constraint = [
    {
      key: "userid",
      constraint_type: "equals",
      value: user.uid,
    },
  ];
  const end = `constraints=${JSON.stringify(constraint)}`;

  const get = await axios
    .get(
      `https://celie.bubbleapps.io/version-test/api/1.1/obj/experiences?${end}`
    )
    .then((res) => res.data.response.results)
    .catch((e) => console.log(e));

  const experiences = await get.map((exp) => {
    return {
      tripID: exp.TripID,
      expID: exp.ExperienceID,
    };
  });

  return { experiences: await experiences };
});

exports.getUser = functions.https.onCall(async (user) => {
  const constraint = [
    {
      key: "email",
      constraint_type: "equals",
      value: user.email,
    },
  ];

  const end = `constraints=${JSON.stringify(constraint)}`;

  const get = await axios
    .get(`https://celie.bubbleapps.io/version-test/api/1.1/obj/userids?${end}`)
    .then((res) => {
      return res.data.response.count ? true : false;
    })
    .catch((e) => console.log(e));

  return { userFound: await get };
});
