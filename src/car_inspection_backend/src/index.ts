import {
  Canister,
  query,
  text,
  Record,
  Principal,
  Vec,
  update,
  StableBTreeMap,
  Variant,
  Result,
  Err,
  ic,
  Ok,
  nat64,
} from "azle";
const Car = Record({
  name: text,
  model: text,
});
const User = Record({
  username: text,
  id: Principal,
  carHistory: Vec(Car),
});

const comments = Record({
  by: text,
  id: Principal,
  comment: text,
  createdAt: nat64,
});
const Complain = Record({
  by: text,
  id: Principal,
  complain: text,
});
const Question = Record({
  question: text,
  email: text,
  id: Principal,
});
const Rate = Record({
  by: text,
  rate: nat64,
  id: Principal,
});
const HistoryPayload = Record({
  username: text,
});
const scheduleInspection = Record({
  username: text,
  carname: text,
  desiredDate: text,
  createdAt: nat64,
});

type Complain = typeof Complain.tsType;
type User = typeof User.tsType;
type Comments = typeof comments.tsType;
type Question = typeof Question.tsType;
type Rate = typeof Rate.tsType;
type scheduleInspection = typeof scheduleInspection.tsType;
const userPayload = Record({
  username: text,
});
const commentPayload = Record({
  username: text,
  comment: text,
});
const ComplainPayload = Record({
  username: text,
  complain: text,
});
const QuestionPayload = Record({
  question: text,
  email: text,
});
const ratePayload = Record({
  rate: nat64,
  username: text,
});
const scheduleInspectionPayload = Record({
  carname: text,
  username: text,
  desiredDate: text,
});
const getCarBookingDatePayload = Record({
  username: text,
  carname: text,
});
//storages
const UserStorages = StableBTreeMap<text, User>(0);
const commentsStorages = StableBTreeMap<Principal, Comments>(1);
const complainStorages = StableBTreeMap<Principal, Complain>(2);
const questionStorages = StableBTreeMap<Principal, Question>(3);
const rateStorages = StableBTreeMap<Principal, Rate>(4);
const carBookingInspectionStorages = StableBTreeMap<text, scheduleInspection>(
  5
);
//errors
const Errors = Variant({
  UserAlreadyExist: text,
  UserNotFound: text,
  UserMustBeRegistered: text,
  MissingCredentials: text,
  CarNotScheduled: text,
});
export default Canister({
  registerUser: update([userPayload], Result(text, Errors), (payload) => {
    if (!payload.username) {
      return Err({
        MissingCredentials: "some credentials are missing",
      });
    }
    //check if user already exist
    const getUser = UserStorages.get(payload.username).Some;
    if (getUser) {
      return Err({
        UserAlreadyExist: `username prvided already exist`,
      });
    }
    const newUser: User = {
      username: payload.username,
      id: ic.caller(),
      carHistory: [],
    };
    UserStorages.insert(payload.username, newUser);
    return Ok(`user with ${payload.username} has been registered successfully`);
  }),
  //comment
  giveComment: update([commentPayload], Result(text, Errors), (payload) => {
    if (!payload.comment || !payload.username) {
      return Err({
        MissingCredentials: "some credentials are missing",
      });
    }
    //check if user is already logged in
    const getUser = UserStorages.get(payload.username).Some;
    if (!getUser) {
      return Err({
        UserMustBeRegistered: "must be registered",
      });
    }
    const newComment: Comments = {
      by: payload.username,
      id: generateId(),
      comment: payload.comment,
      createdAt: ic.time(),
    };
    commentsStorages.insert(generateId(), newComment);
    return Ok("comment sent");
  }),
  giveComplain: update([ComplainPayload], Result(text, Errors), (payload) => {
    if (!payload.complain || !payload.username) {
      return Err({
        MissingCredentials: "some credentials are missings",
      });
    }
    //check if user complaining is registered

    const getUser = UserStorages.get(payload.username).Some;
    if (!getUser) {
      return Err({
        UserMustBeRegistered:
          "must be registered inorder to submit your complain",
      });
    }
    const newComplain: Complain = {
      by: payload.username,
      id: generateId(),
      complain: payload.complain,
    };
    complainStorages.insert(generateId(), newComplain);
    return Ok("successfully submited your complain ");
  }),
  askQuestion: update([QuestionPayload], Result(text, Errors), (payload) => {
    if (!payload.question || !payload.email) {
      return Err({
        MissingCredentials: "credentails are missing",
      });
    }
    const newQuestion: Question = {
      question: payload.question,
      email: payload.email,
      id: generateId(),
    };
    questionStorages.insert(generateId(), newQuestion);
    return Ok(
      "your question has been submitted successfuly feedback will be provided through emial provided"
    );
  }),
  rateOurServices: update([ratePayload], Result(text, Errors), (payload) => {
    if (!payload.rate || !payload.username) {
      return Err({
        MissingCredentials: "some credentails are missings",
      });
    }
    //check if user rating is registered

    const getUser = UserStorages.get(payload.username).Some;
    if (!getUser) {
      return Err({
        UserMustBeRegistered: "must be registered inorder to rate our services",
      });
    }
    const newRate: Rate = {
      by: payload.username,
      rate: payload.rate,
      id: generateId(),
    };
    rateStorages.insert(generateId(), newRate);
    return Ok("thank you for your rate");
  }),

  //getHistory of your activities on carInspector
  getHistory: query([HistoryPayload], Result(Vec(Car), Errors), (payload) => {
    if (!payload.username) {
      return Err({
        MissingCredentials: "some credentials are missing",
      });
    }
    //check if user is registered

    const getUser = UserStorages.get(payload.username).Some;
    if (!getUser) {
      return Err({
        UserMustBeRegistered: "Not registered",
      });
    }
    //get users history
    return Ok(getUser.carHistory);
  }),
  //book for inspection
  bookInspection: update(
    [scheduleInspectionPayload],
    Result(text, Errors),
    (payload) => {
      if (!payload.carname || !payload.username || !payload.desiredDate) {
        return Err({
          MissingCredentials: "soem credentails are missing",
        });
      }

      const getUser = UserStorages.get(payload.username).Some;
      if (!getUser) {
        return Err({
          UserMustBeRegistered: "Not registered",
        });
      }
      //book
      const newBook: scheduleInspection = {
        username: payload.username,
        carname: payload.carname,
        desiredDate: payload.desiredDate,
        createdAt: ic.time(),
      };
      carBookingInspectionStorages.insert(payload.username, newBook);
      return Ok("your car has been booked successfully");
    }
  ),
  //reschedule for inspection
  rescheduleCarInspection: update(
    [scheduleInspectionPayload],
    Result(text, Errors),
    (payload) => {
      if (!payload.carname || !payload.desiredDate || !payload.username) {
        return Err({
          MissingCredentials: "soem credentails are missing",
        });
      }
      //check if user had already scheduled
      const getScheduled = carBookingInspectionStorages.get(
        payload.username
      ).Some;
      if (!getScheduled) {
        return Err({
          CarNotScheduled: "you havent scheduled your acr for inspection",
        });
      }
      //reschedule
      const newSchedule: scheduleInspection = {
        username: payload.username,
        carname: payload.carname,
        desiredDate: payload.desiredDate,
        createdAt: ic.time(),
      };
      carBookingInspectionStorages.insert(payload.username, newSchedule);
      //update on users side
      return Ok("your car has inspection date has been rescheduled");
    }
  ),
  getCarBookingDate: query(
    [getCarBookingDatePayload],
    Result(text, Errors),
    (payload) => {
      if (!payload.carname || !payload.username) {
        return Err({
          MissingCredentials: "soem credentails are missing",
        });
      }
      const getCarDate = carBookingInspectionStorages.get(
        payload.username
      ).Some;
      if (!getCarDate) {
        return Err({
          CarNotScheduled: "your car is not booked for any inspection",
        });
      }
      return Ok(getCarDate.desiredDate);
    }
  ),
});
//function to generate Principals ids

function generateId(): Principal {
  const randomBytes = new Array(29)
    .fill(0)
    .map((_) => Math.floor(Math.random() * 256));
  return Principal.fromUint8Array(Uint8Array.from(randomBytes));
}
