const usersController = require("./controllers/usersController");
const authorization = require("./middleware/authorization");

module.exports = (app) => {
    app.get("/allusers", authorization, usersController.getAllUsers);
    app.get("/users", authorization, usersController.getAllUsersWithRole);
    app.get("/:id", authorization, usersController.getUserWithRole);

    app.post("/register", usersController.register);
    app.post("/login", usersController.login);
    app.post("/sendInvite", authorization, usersController.sendInvite);

    app.put("/:id", authorization, usersController.changeRole);

    app.delete("/:id", authorization, usersController.removeUser);
}