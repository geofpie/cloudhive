<!DOCTYPE html>
<html>
<head>
    <!-- birb social by Geoffrey Lee -->
    <title>Register</title>
    <!-- Bootstrap -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.3.1/dist/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
    <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/popper.js@1.14.7/dist/umd/popper.min.js" integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.3.1/dist/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossorigin="anonymous"></script>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap" rel="stylesheet">

    <!-- Font Awesome -->
    <script src="https://kit.fontawesome.com/80b07c2a17.js" crossorigin="anonymous"></script>
    
    <!-- Stylesheet -->
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container-fluid">
        <div class="login-register-page row align-items-center">
            <div class="col"></div>
            <div class="login-register-form col-md shadow-lg">
                <img src="assets/logo-dark.svg" width="80px" class="form-logo">
                <div>
                    <a class="login-form-selector-active" href="#">Register</a>
                    <a class="login-form-selector-standby" href="#">Log In</a>
                    <p class="subtitle-text">Hey, we can't wait to have you onboard.</p>
                </div>
                <form method="post" action="register.php">
                    <input class="login-form-textfield" type="text" name="username" placeholder="Username" required><br><br>
                    <input class="login-form-textfield" type="email" name="email" placeholder="Email" required><br><br>
                    <input class="login-form-textfield" type="password" name="password" placeholder="Password" required><br><br>
                    <button class="login-form-button" type="submit">Register</button>
                </form>
                <p class="login-already-class">Already have an account? <a href="login.php">Login here</a></p>
            </div>
            <div class="col"></div>
        </div>
    </div>
</body>
</html>