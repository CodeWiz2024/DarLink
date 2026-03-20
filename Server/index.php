<?php
session_start();

$password = "3054";

// Handle login
if (isset($_POST['password'])) {
    if ($_POST['password'] === $password) {
        $_SESSION['authenticated'] = true;
    } else {
        $error = "كلمة المرور غير صحيحة"; // Incorrect password
    }
}

// Handle logout
if (isset($_GET['logout'])) {
    session_destroy();
    header("Location: index.php");
    exit;
}

// Handle server actions
if (isset($_POST['action']) && isset($_SESSION['authenticated']) && $_SESSION['authenticated']) {
    if ($_POST['action'] === 'start') {
        // Run node app.js in the background on Windows
        // We use start /B to run in background, and redirect output to a log file
        pclose(popen('start /B node app.js > server.log 2>&1', 'r'));
        $msg = "تمت محاولة تشغيل السيرفر بنجاح! راجع ملف server.log للتفاصيل.";
        $msg_type = "success";
    }
    elseif ($_POST['action'] === 'stop') {
        // Kill node processes
        exec("taskkill /F /IM node.exe", $output, $return_var);
        if ($return_var === 0) {
            $msg = "تم إيقاف السيرفر بنجاح.";
            $msg_type = "success";
        } else {
            $msg = "لم يتم العثور على سيرفر قيد التشغيل أو حدث خطأ.";
            $msg_type = "error";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تشغيل السيرفر</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f0f2f5;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
            text-align: center;
        }
        h2 {
            color: #333;
            margin-bottom: 20px;
        }
        input[type="password"] {
            width: 100%;
            padding: 12px;
            margin: 10px 0 20px 0;
            border: 1px solid #ddd;
            border-radius: 5px;
            box-sizing: border-box;
            font-size: 16px;
        }
        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
            transition: background 0.3s;
            margin-bottom: 15px;
        }
        button:hover {
            background: #0056b3;
        }
        .btn-stop {
            background: #dc3545;
        }
        .btn-stop:hover {
            background: #c82333;
        }
        .alert {
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
        }
        .alert-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .alert-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .logout-link {
            color: #6c757d;
            text-decoration: none;
            font-size: 14px;
            display: inline-block;
            margin-top: 10px;
        }
        .logout-link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>

<div class="container">
    <?php if (!isset($_SESSION['authenticated']) || !$_SESSION['authenticated']): ?>
        <h2>حماية إعدادات السيرفر</h2>
        <?php if (!empty($error)) echo "<div class='alert alert-error'>$error</div>"; ?>
        <form method="post">
            <input type="password" name="password" placeholder="أدخل كلمة المرور (3054)" required autofocus>
            <button type="submit">دخول</button>
        </form>
    <?php else: ?>
        <h2>شاشة تشغيل السيرفر</h2>
        <?php if (!empty($msg)) echo "<div class='alert alert-$msg_type'>$msg</div>"; ?>
        
        <form method="post">
            <input type="hidden" name="action" value="start">
            <button type="submit">تشغيل السيرفر (Start Node.js)</button>
        </form>
        
        <form method="post">
            <input type="hidden" name="action" value="stop">
            <button type="submit" class="btn-stop">إيقاف السيرفر (Stop Node.js)</button>
        </form>

        <a href="?logout=1" class="logout-link">تسجيل الخروج</a>
    <?php endif; ?>
</div>

</body>
</html>
