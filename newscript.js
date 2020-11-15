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
const Functions = firebase.functions();

const firebaseDiv = document.getElementById("firebase-auth");
// FACEBOOK INIT
const facebookInit = () => {
  window.fbAsyncInit = function () {
    FB.init({
      appId: 367693800966361,
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
    await Auth.signInWithEmailAndPassword(email, password).catch(() =>
      signUp()
    );
  };

  const signUp = async () => {
    await Auth.createUserWithEmailAndPassword(email, password).catch(
      (error) => {
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
        if (!local.photoURL) {
          local.photoURL = result.user.photoURL;
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
    tripID,
    toggle,
    expButtons,
  };
})();

const bubble = (() => {
  let userId;

  const pull = async () => {
    const getExperiences = await Functions.httpsCallable("getExperiences");
    const userExp = await getExperiences({
      uid: userId,
    })
      .then((data) => data)
      .catch();

    const experienceArray = await userExp.data.experiences;

    return await experienceArray;
  };

  const edit = async (but) => {
    if (!Auth.currentUser) return;

    const editExperiences = Functions.httpsCallable("editExperience");

    editExperiences({
      userID: userId,
      tripID: experience.tripID(but),
      experienceID: experience.expID(but),
    }).catch();
  };

  const register = async (user) => {
    const signUp = Functions.httpsCallable("signUp");

    signUp({
      email: user.email,
      userID: userId,
    }).catch();
  };

  const connect = async (user) => {
    const getUser = Functions.httpsCallable("getUser");
    const currentUser = await getUser({ email: user.email })
      .then((res) => res.data.userFound)
      .catch();

    const currentUserID = currentUser.results[0].UserID;

    userId = currentUserID !== user.uid ? currentUserID : Auth.currentUser.uid;

    if (await currentUser.count) {
      await pull()
        .then((arr) => experience.expButtons(arr))
        .catch();
    } else {
      await register(user)
        .then(() =>
          edit(document.querySelector("[data-experience-selected='true']"))
        )
        .catch();
    }
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
    userPic.style.backgroundImage = `url("${Auth.currentUser.photoURL}")`;
  }
};

const loadLogInEventListeners = (boo) => {
  const google = document.getElementById("google");
  const facebook = document.getElementById("facebook");
  const emailAuth = document.getElementById("email");
  const emailNext = [...document.querySelectorAll(".email-next")];
  const emailClick = document.getElementById("email-click");
  const providers = [google, facebook];

  if (boo) {
    credentialAuth.inputEventListeners(true);
    emailAuth.addEventListener("click", () => credentialAuth.signIn());
    emailClick.addEventListener("click", () => {
      emailNext.forEach((elm) => (elm.style.display = "block"));
      providers.forEach((elm) => (elm.style.display = "none"));
      emailClick.style.display = "none";
      emailAuth.style.display = "block";
    });
    providers.forEach((but) => {
      but.addEventListener("click", () => providerAuth.assign(but));
    });
  } else {
    credentialAuth.inputEventListeners(false);
    emailAuth.removeEventListener("click", () => credentialAuth.signIn());
    emailNext.forEach((elm) => (elm.style.display = "none"));
    providers.forEach((but) => {
      but.removeEventListener("click", () => providerAuth.assign(but));
      but.style.display = "block";
    });
    emailClick.style.display = "block";
    emailAuth.style.display = "none";
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
