const firebaseConfig = {
  apiKey: "AIzaSyBRZfDCC3YyZutj-lOnDxhq4n7u9AtOkCs",
  authDomain: "travel-895d5.firebaseapp.com",
  databaseURL: "https://travel-895d5.firebaseio.com",
  projectId: "travel-895d5",
  storageBucket: "travel-895d5.appspot.com",
  messagingSenderId: "74709196792",
  appId: "1:74709196792:web:d37d5c4069c2191b46c00d",
};
// FIREBASE INIT
firebase.initializeApp(firebaseConfig);
const Auth = firebase.auth();
const firebaseDiv = document.getElementById("firebase-auth");
// FACEBOOK INIT
const facebookInit = () => {
  window.fbAsyncInit = function () {
    FB.init({
      appId: 3482893361786244,
      cookie: true,
      xfbml: true,
      version: "v8.0",
    });

    FB.AppEvents.logPageView();
  };

  (function (d, s, id) {
    var js,
      fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {
      return;
    }
    js = d.createElement(s);
    js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  })(document, "script", "facebook-jssdk");
};

// LOCAL STORAGE FUNCTIONS
const localStorageFunction = (() => {
  const getLocalUser = () => JSON.parse(localStorage.getItem("User"));
  const setLocalUser = () =>
    localStorage.setItem("User", JSON.stringify(localUser));

  const localUser = getLocalUser()
    ? getLocalUser()
    : {
        email: "",
        uid: "",
        photoURL: "",
      };

  const setUser = (result) => {
    localUser.email = result.email;
    localUser.uid = result.uid;
    localUser.photoURL = result.photoURL;
    setLocalUser();
  };

  return {
    localUser,
    getLocalUser,
    setLocalUser,
    setUser,
  };
})();

// SIGN IN CREDENTIALS
const credentialAuth = (() => {
  const local = localStorageFunction.localUser;
  const emailInput = document.getElementById("email-input");
  const passwordInput = document.getElementById("password-input");

  let email = "";
  let password = "";

  const emailChangeOnInput = () => {
    if (/@gmail.com$/.test(emailInput.value)) {
      email = normalizeGmail(emailInput.value);
    } else {
      email = emailInput.value;
    }
  };

  const inputEventListeners = (boo) => {
    if (boo) {
      emailInput.addEventListener("input", () => emailChangeOnInput());
      passwordInput.addEventListener(
        "input",
        () => (password = passwordInput.value)
      );
    } else {
      emailInput.removeEventListener("input", () => emailChangeOnInput());
      passwordInput.removeEventListener(
        "input",
        () => (password = passwordInput.value)
      );
    }
  };

  const normalizeGmail = (str) => {
    const inx = str.indexOf("@");
    return str.substring(0, inx).replace(".", "") + str.substring(inx);
  };

  const signIn = async () => {
    await Auth.signInWithEmailAndPassword(email, password).catch((error) => {
      console.log(error);
      signUp();
    });
  };

  const signUp = async () => {
    await Auth.createUserWithEmailAndPassword(email, password).catch(
      (error) => {
        console.log(error);
        // ADD IF EMAIL USED IS IN DB
        const enteredEmailStored = email === local.email;
        if (error.code === "auth/email-already-in-use" || enteredEmailStored) {
          link();
        }
      }
    );
  };

  const link = async () => {
    const credentials = await firebase.auth.EmailAuthProvider.credential(
      email,
      password
    );
    await providerAuth.LogInToLink();
    await Auth.currentUser
      .linkWithCredential(await credentials)
      .then((result) => {
        //   IF UID UPDATED DUE TO LINKING OF ACCOUNTS
        console.log(result);
        if (
          result.user.uid !== local.uid &&
          result.user.email === local.email
        ) {
          localUser.uid = result.user.uid;
          console.log("UserID Updated");
          if (!local.photoURL) {
            local.photoURL = result.user.photoURL;
          }
        }
      })
      .catch();
  };

  return {
    signIn,
    inputEventListeners,
  };
})();

// SIGN IN PROVIDER
const providerAuth = (() => {
  const googleProvider = new firebase.auth.GoogleAuthProvider();
  const facebookProvider = new firebase.auth.FacebookAuthProvider();
  const authMethods = [googleProvider, facebookProvider];

  const assign = (button) => {
    button.id === "google" ? signIn(googleProvider) : signIn(facebookProvider);
  };

  const signIn = (provider) => {
    return Auth.signInWithPopup(provider)
      .then((result) => {
        if (result) return true;
      })
      .catch();
  };

  const linkWithProvider = (provider) => {
    return Auth.currentUser
      .linkWithPopup(provider)
      .catch(() => linkWithProvider(provider));
  };

  //   If users email is already registered with another log in method it attempts the log in with all the
  //   provider methods until successful so it can link accounts
  const LogInToLink = async () => {
    for (i = 0; i < authMethods.length - 1; i++) {
      if (await signIn(authMethods[i])) {
        break;
      }
    }
  };

  return {
    assign,
    signIn,
    LogInToLink,
  };
})();

// EXPERIENCE BUTTON CONTROLS
const experience = (() => {
  const expID = (but) => but.getAttribute("data-experienceid");
  const tripID = (but) => but.getAttribute("data-tripid");

  const showSelectedExperience = (but, boolean) => {
    but.setAttribute("data-experience-selected", `${boolean}`);
    but.innerHTML = boolean
      ? `<i class="fa fa-heart" aria-hidden="true"></i>  REMOVE FROM LIST`
      : `<i class="fa fa-heart-o" aria-hidden="true"></i>  ADD TO LIST`;
  };

  const toggle = (but) => {
    const expSelected = but.getAttribute("data-experience-selected");
    expSelected === "false"
      ? showSelectedExperience(but, true)
      : showSelectedExperience(but, false);

    bubble.edit(but);
  };

  const initializeButton = (but, trip, exp) => {
    but.setAttribute("data-experience-selected", "false");
    but.setAttribute("data-tripid", trip);
    but.setAttribute("data-experienceid", exp);
    but.addEventListener("click", () => {
      toggle(but);
      if (!Auth.currentUser) {
        showSignIn(true);
      }
    });
  };
  const buttonInfo = (but) => {
    const experienceInfo = but
      .closest(".w-dyn-item")
      .querySelector("[data-gallery='true']");
    const trip = tripID(experienceInfo);
    const exp = expID(experienceInfo);
    initializeButton(but, trip, exp);
  };

  const experiencePrevSelected = (arr, trip, exp) => {
    return arr.findIndex((x) => x.tripID === trip && x.expID === exp);
  };

  const experienceButtons = document.querySelectorAll(".itin-exp-btns_txt");

  experienceButtons.forEach((but) => {
    buttonInfo(but);
  });

  const expButtons = async (arr) => {
    const userLoggedIn = await Auth.currentUser;

    experienceButtons.forEach(async (but) => {
      let tripId = tripID(but);
      let expId = expID(but);
      if (userLoggedIn) {
        if (experiencePrevSelected(arr, tripId, expId) >= 0) {
          showSelectedExperience(but, true);
        }
      } else {
        showSelectedExperience(but, false);
      }
    });
  };

  return {
    expID,
    expID,
    toggle,
    expButtons,
  };
})();

const bubble = (() => {
  const api = `2830d61fdf419466f737ce9889444aae`;
  const test = true;
  const version = test ? `/version-test` : "";

  const endpointWithConstraints = (end, key, value) => {
    const constraintObj = [
      {
        key: key,
        constraint_type: "equals",
        value: value,
      },
    ];
    const urlCode = JSON.stringify(constraintObj);

    return `${end}?constraints=${urlCode}`;
  };

  const data = (endpoint, method, obj) => {
    const area = method === "POST" ? "wf" : "obj";
    const data = fetch(
      `https://celie.bubbleapps.io${version}/api/1.1/${area}/${endpoint}`,
      {
        method: method,
        body: obj ? JSON.stringify(obj) : null,
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          Authorization: `Bearer ${api}`,
        },
      }
    )
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => data)
      .catch();

    return data;
  };

  const pull = async (user) => {
    const getExpEndpoint = endpointWithConstraints(
      "experiences",
      "userid",
      user.uid
    );
    const userExp = await data(getExpEndpoint, "GET");
    let userExpArray = [];
    await userExp.response.results.forEach((exp) => {
      let expObj = {
        tripID: exp.TripID,
        expID: exp.ExperienceID,
      };
      userExpArray.push(expObj);
    });

    return userExpArray;
  };

  const edit = (but) => {
    if (localStorageFunction.localUser.uid === "") return;
    const expObj = {
      userID: localStorageFunction.localUser.uid,
      tripID: experience.tripID(but),
      experienceID: experience.expID(but),
    };
    data("edit-experiences", "POST", expObj);
  };

  const register = async (user) => {
    const newUser = { email: user.email, userID: user.uid };
    await data("/signup", "POST", newUser)
      .then(() => {
        const firstExpSelected = document.querySelector(
          "[data-experience-selected='true']"
        );
        edit(firstExpSelected);
      })
      .catch();
  };

  const connect = async (user) => {
    const checkUserEndpoint = endpointWithConstraints(
      "userids",
      "email",
      user.email
    );

    const bubbleUser = await data(checkUserEndpoint, "GET");

    bubbleUser.response.count
      ? await pull(user).then((arr) => experience.expButtons(arr))
      : await register(user);
  };

  return {
    edit,
    connect,
  };
})();

const toggleSignIn = (boolean) => {
  const logInOutDiv = document.getElementById("signin");

  if (boolean) {
    logInOutDiv.innerHTML = `<a id="log-in" href="#" class="nav-link w-nav-link">Sign In</a>`;
    const logInButton = document.getElementById("log-in");
    logInButton.addEventListener("click", () => showSignIn(true));
  } else {
    logInOutDiv.innerHTML = `<div id="user-pic" class="nav-link w-nav-link" ></div>`;
    const userPic = document.getElementById("user-pic");
    userPic.style.backgroundImage = `url("${localStorageFunction.localUser.photoURL}")`;
  }
};

const loadLogInEventListeners = (boo) => {
  const google = document.getElementById("google");
  const facebook = document.getElementById("facebook");
  const emailAuth = document.getElementById("email");
  const providers = [google, facebook];

  if (boo) {
    credentialAuth.inputEventListeners(true);
    emailAuth.addEventListener("click", () => credentialAuth.signIn());
    providers.forEach((but) => {
      but.addEventListener("click", () => providerAuth.assign(but));
    });
  } else {
    credentialAuth.inputEventListeners(false);
    emailAuth.removeEventListener("click", () => credentialAuth.signIn());
    providers.forEach((but) =>
      but.removeEventListener("click", () => providerAuth.assign(but))
    );
  }
};

const showSignIn = (boo) => {
  if (boo) {
    loadLogInEventListeners(true);
    firebaseDiv.removeAttribute("hidden");
  } else {
    loadLogInEventListeners(false);
    firebaseDiv.setAttribute("hidden", "");
  }
};

Auth.onAuthStateChanged((user) => {
  if (user) {
    localStorageFunction.setUser(user);
    toggleSignIn(false);
    showSignIn(false);
    bubble.connect(user);
  } else {
    toggleSignIn(true);
  }
});
