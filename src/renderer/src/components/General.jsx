import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  getAuth,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut,
} from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Box,
  TextField,
  Button,
  Avatar,
  Typography,
  Paper,
  Container,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import LogoutIcon from "@mui/icons-material/Logout";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { useNavigate } from "react-router-dom";

const Input = styled("input")({
  display: "none",
});

const General = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [avatar, setAvatar] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [severity, setSeverity] = useState("error");
  const { currentUser, dispatch } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminData = async () => {
      if (currentUser && currentUser.email) {
        const db = getFirestore();
        const adminsRef = collection(db, "admins");
        const q = query(adminsRef, where("email", "==", currentUser.email));

        try {
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            setName(data.name || "");
            setEmail(data.email || "");
            setPhone(data.phone || "");
            setAddress(data.address || "");
            setAvatar(data.image || "");
          });
        } catch (error) {
          console.error("Error fetching admin data:", error);
          showSnackbar("Error fetching user data");
        }
      }
    };

    fetchAdminData();
  }, [currentUser]);

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setAvatar(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      dispatch({ type: "LOGOUT" });
      navigate("/");
      showSnackbar("Logged out successfully", "success");
    } catch (error) {
      console.error("Error logging out:", error);
      showSnackbar("Error logging out", "error");
    }
  };

  const showSnackbar = (message, severity = "error") => {
    setSnackbarMessage(message);
    setSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSaveChanges = async () => {
    const auth = getAuth();
    const db = getFirestore();
    const storage = getStorage();

    try {
      // Update password if old password is provided
      if (oldPassword) {
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          oldPassword
        );
        await reauthenticateWithCredential(currentUser, credential);
        if (newPassword) {
          await updatePassword(currentUser, newPassword);
          showSnackbar("Password updated successfully", "success");
        }
      }

      // Update profile information
      const adminsRef = collection(db, "admins");
      const q = query(adminsRef, where("email", "==", currentUser.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const adminDoc = querySnapshot.docs[0];
        const updateData = { name };

        // Upload new avatar if changed
        if (avatarFile) {
          const avatarRef = ref(storage, `admin_avatars/${currentUser.uid}`);
          await uploadBytes(avatarRef, avatarFile);
          const downloadURL = await getDownloadURL(avatarRef);
          updateData.image = downloadURL;
        }

        await updateDoc(doc(db, "admins", adminDoc.id), updateData);
        showSnackbar("Profile updated successfully", "success");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showSnackbar("Error updating profile");
    }

    // Reset password fields
    setOldPassword("");
    setNewPassword("");
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom align="center">
        Admin Settings
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mb: 3,
        }}
      >
        <input
          accept="image/*"
          id="avatar-upload"
          type="file"
          onChange={handleAvatarChange}
          style={{ display: "none" }}
        />
        <label htmlFor="avatar-upload">
          <IconButton component="span" sx={{ position: "relative" }}>
            <Avatar src={avatar} sx={{ width: 100, height: 100, mb: 2 }} />
            <CameraAltIcon
              sx={{
                position: "absolute",
                bottom: 10,
                right: 0,
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                borderRadius: "50%",
                padding: "4px",
              }}
            />
          </IconButton>
        </label>
        <Typography variant="body2" color="textSecondary">
          Click to change avatar
        </Typography>
      </Box>
      <Box component="form" noValidate autoComplete="off">
        <TextField
          fullWidth
          label="Email"
          variant="outlined"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="normal"
          disabled
        />
        <TextField
          fullWidth
          label="Name"
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Phone"
          variant="outlined"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Address"
          variant="outlined"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Old Password"
          variant="outlined"
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          margin="normal"
        />
        <TextField
          fullWidth
          label="New Password"
          variant="outlined"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          margin="normal"
        />
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleSaveChanges}
          >
            Save Changes
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="large"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={severity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default General;