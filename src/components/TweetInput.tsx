import React, { useState } from "react";
import classes from "./TweetInput.module.css";
import { useSelector } from "react-redux";
import { selectUser } from "../features/userSlice";
import { auth, storage, db } from "../firebase";
import { Avatar, Button, IconButton } from "@material-ui/core";
import firebase from "firebase/app";
import AddPhotoIcon from "@material-ui/icons/AddAPhoto";

const TweetInput: React.FC = () => {
  const user = useSelector(selectUser);
  const [tweetImage, setTweetImage] = useState<File | null>(null);
  const [tweetMsg, setTweetMsg] = useState("");
  const onChangeImageHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files![0]) {
      setTweetImage(e.target.files![0]);
      e.target.value = "";
    }
  };
  const sendTweet = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (tweetImage) {
      const S =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const N = 16;
      const randomChar = Array.from(crypto.getRandomValues(new Uint32Array(N)))
        .map((n) => S[n % S.length])
        .join("");
      const fileName = randomChar + "_" + tweetImage.name;
      const uploadTweetImg = storage.ref(`images/${fileName}`).put(tweetImage);
      uploadTweetImg.on(
        firebase.storage.TaskEvent.STATE_CHANGED,

        () => {},
        (err) => {
          alert(err.message);
        },
        async () => {
          await storage
            .ref("images")
            .child(fileName)
            .getDownloadURL()
            .then(async (url) => {
              await db.collection("posts").add({
                avatar: user.photoUrl,
                image: url,
                text: tweetMsg,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                username: user.displayName,
              });
            });
        },
      );
    } else {
      db.collection("posts").add({
        avatar: user.photoUrl,
        image: "",
        text: tweetMsg,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        username: user.displayName,
      });
    }
    setTweetImage(null);
    setTweetMsg("");
  };
  return (
    <>
      <form onSubmit={sendTweet}>
        <div className={classes.tweet_form}>
          <Avatar
            className={classes.tweet_avatar}
            src={user.photoUrl}
            onClick={async () => {
              await auth.signOut();
            }}
          />
          <input
            className={classes.tweet_input}
            placeholder="What's happening"
            type="text"
            autoFocus
            value={tweetMsg}
            onChange={(e) => setTweetMsg(e.target.value)}
          />
          <IconButton>
            <label>
              <AddPhotoIcon
                className={
                  tweetImage
                    ? classes.tweet_addIconLoaded
                    : classes.tweet_addIcon
                }
              />
              <input
                className={classes.tweet_hiddenIcon}
                type="file"
                onChange={onChangeImageHandler}
              />
            </label>
          </IconButton>
        </div>
        <Button
          type="submit"
          disabled={!tweetMsg}
          className={
            tweetMsg ? classes.tweet_sendBtn : classes.tweet_sendDisableBtn
          }
        >
          Tweet
        </Button>
      </form>
    </>
  );
};

export default TweetInput;
