const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const filePath = path.join(__dirname, 'users.json');
const data = JSON.parse(fs.readFileSync(filePath));

const Sentry = require('@sentry/node');

const getUserByEmailAndPassword = (email, password) => {
    const user = data.users.find(user => user.email === email && user.password === password);
    return user || null;
};

router.post('/api/add-friend', (req, res) => {
    const { friendId, userId } = req.body;
    const user = data.users.find(u => u.id === Number(userId));
    const friend = data.users.find(u => u.id === Number(friendId));

    user.friends.push(friend.id);
    friend.friends.push(user.id);

    fs.writeFileSync('users.json', JSON.stringify(data, null, 2));
    res.status(200).json({ success: true, message: 'User added to friends successfully' });
});

router.post('/api/remove-friend', (req, res) => {
    const { friendId, userId } = req.body;
    const user = data.users.find(u => u.id === Number(userId));
    const friend = data.users.find(u => u.id === Number(friendId));

    user.friends = user.friends.filter(id => id !== friend.id);
    friend.friends = friend.friends.filter(id => id !== user.id);

    fs.writeFileSync('users.json', JSON.stringify(data, null, 2));
    res.status(200).json({ success: true, message: 'User removed from friends successfully' });
});

router.get('/api/users', (req, res) => {
    try {
        res.status(200).json(data.users);
    } catch (error) {
        console.error(error);
        Sentry.captureException(error);
        res.status(500).json({ success: false, error: 'Произошла ошибка при загрузке списка пользователей' });
    }
});

router.get('/api/friends/:userId', (req, res) => {
    const userId = req.params.userId;
    const user = data.users.find(user => user.id === Number(userId));

    const friendIds = user.friends || [];
    const friends = data.users.filter(user => friendIds.includes(user.id));

    res.status(200).json(friends );
});

router.post('/api/users/update-photo', (req, res) => {
    try {
        const { userId, newPhotoUrl } = req.body;

        const user = data.users.find(user => user.id === Number(userId));
        if (user) {
            user.photo = newPhotoUrl;
            fs.writeFileSync('users.json', JSON.stringify(data, null, 2));
            res.status(200).json({ success: true, message: 'Фото успешно обновлено' });
        } else {
            Sentry.captureException({error: "Пользователь не найден"});
            res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }
    } catch (error) {
        console.error(error);
        Sentry.captureException(error);
        res.status(500).json({ success: false, error: 'Произошла ошибка при обновлении фото' });
    }
});

router.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    try {
        const user = getUserByEmailAndPassword(email, password);

        if (user) {
            const token = jwt.sign({ email: user.email }, 'my_secret_key', { expiresIn: '1h' });
            res.status(200).json({ success: true, token, user });
        } else {
            Sentry.captureException({error: "Неверные учетные данные"});
            res.status(401).json({ success: false, message: `Неверные учетные данные ${email} ${password}` });
        }
    } catch (error) {
        console.error(error);
        Sentry.captureException(error);
        res.status(500).json({ success: false, message: 'Ошибка при входе' });
    }
});

router.get('/api/user/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const user = data.users.find(user => user.id === userId);

    res.status(200).json(user);
});

router.get('/api/news/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const user = data.users.find(user => user.id === userId);

    if (!user) {
        Sentry.captureException({error: "Пользователь не найден"});
        return res.status(404).send('Пользователь не найден');
    }

    var news = data.news.filter(news => news.userId === user.id);
    news = news.map(news => ({
        ...news,
        time: formatTime(news.time)
    }));
    res.json(news);
});

router.get('/api/friends/news/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const user = data.users.find(user => user.id === userId);
    const friendsIds = user ? user.friends : [];
    var friendNews = data.news.filter(news => friendsIds.includes(news.userId));
    friendNews = friendNews.filter(news => news.status === 'active');

    const formattedNews = friendNews.map(news => ({
        ...news,
        time: formatTime(news.time)
    }));
    res.json(formattedNews);
});

router.post('/api/add/news/:userId', (req, res) => {
    const userId = req.params.userId;
    const user = data.users.find(user => user.id === Number(userId));
    const { content } = req.body;
    const time = new Date().toISOString()

    try {
        const newNews = { userId: Number(userId), content, time: time, id:  generateRandomNewsId(), status: "active", userName: user.name};

        data.news.push(newNews);
        fs.writeFileSync('users.json', JSON.stringify(data, null, 2));

        res.status(200).json({ success: true, message: 'Новость успешно добавлена' });
    } catch (error) {
        console.error(error);
        Sentry.captureException(error);
        res.status(500).json({ success: false, error: `Произошла ошибка при добавлении новости ${content}` });
    }
});

router.get('/api/users/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const user = data.users.find(user => user.id === userId);
    res.json(user);
});

router.post('/api/register', (req, res) => {
    try {
        const username = req.body.username;
        const email = req.body.email;
        const password = req.body.password;

        if (data.users.some(user => user.email === email)) {
            Sentry.captureException({error: "Пользователь с таким email уже зарегистрирован"});
            return res.status(400).json({ success: false, error: 'Пользователь с таким email уже зарегистрирован.' });
        }

        const newUser = { "name": username, "email": email, "password": password, role: "user", status: "active",
            photo: "https://sun1-19.userapi.com/s/v1/ig2/HEYwyGgppTiSOFuM2vg1h6W2aNCCVC6rXoiL3rGwy8q7dM_E9kejkCi1pODwNE-eDrlyt4VEEzmD_sbeaBu9Qcbf.jpg?size=400x400&quality=95&crop=467,154,665,665&ava=1",
            id: generateRandomId(), birthdate: null, friends: [] };
        data.users.push(newUser);

        fs.writeFileSync('users.json', JSON.stringify(data, null, 2));
        res.status(200).json({ success: true, message: `Пользователь успешно зарегистрирован.${username} ${req.body} ${password}` });
    } catch (error) {
        console.error(error);
        Sentry.captureException(error);
        res.status(500).json({ success: false, error: 'Произошла ошибка при регистрации пользователя.' });
    }
});

router.get('/news/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const user = data.users.find(user => user.id === userId);
    const friendsIds = user ? user.friends : [];
    const friendNews = data.news.filter(news => friendsIds.includes(news.userId));

    const findUserById = (userId) => {
        return data.users.find(user => user.id === userId);
    };

    const formattedNews = friendNews.map(news => ({
        ...news,
        time: formatTime(news.time)
    }));

    res.render('news', { news: formattedNews, showBlocked: false, users: data.users, findUserById });
});

router.get('/news', (req, res) => {
    const findUserById = (userId) => {
        return data.users.find(user => user.id === userId);
    };

    const formattedNews = data.news.map(news => ({
        ...news,
        time: formatTime(news.time)
    }));

    res.render('news', { news: formattedNews, showBlocked: true, users: data.users, findUserById });
});

router.post('/news/activate/:newsId', (req, res) => {
    const newsId = req.params.newsId;
    const newsIndex = data.news.findIndex(news => news.id === Number(newsId));

    if (newsIndex !== -1) {
        data.news[newsIndex].status = 'active';

        fs.writeFileSync('users.json', JSON.stringify(data, null, 2));
        res.json({ success: true, message: 'News blocked successfully.' });
    } else {
        Sentry.captureException({error: "News not found"});
        res.status(404).json({ error: 'News not found.' });
    }
});

router.post('/news/block/:newsId', (req, res) => {
    const newsId = req.params.newsId;
    const newsIndex = data.news.findIndex(news => news.id === Number(newsId));

    if (newsIndex !== -1) {
        data.news[newsIndex].status = 'blocked';

        fs.writeFileSync('users.json', JSON.stringify(data, null, 2));
        res.json({ success: true, message: 'News blocked successfully.' });
    } else {
        Sentry.captureException({error: "News not found"});
        res.status(404).json({ error: 'News not found.' });
    }
});

router.get('/users', (req, res) => {
    res.render('users', { users: data.users, h: `Список всех пользователей` });
});

router.get('/friends/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const user = data.users.find(user => user.id === userId);
    const friendsIds = user ? user.friends : [];
    const userFriends = data.users.filter(user => friendsIds.some(friendId => friendId === user.id));

    res.render('users', { users: userFriends, h: `Друзья пользователя ${user.name}` });
});

router.get('/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const user = data.users.find(user => user.id === userId);
    if (!user) {
        Sentry.captureException({error: "Пользователь не найден"});
        return res.status(404).send('Пользователь не найден');
    }

    const news = data.news.filter(news => news.userId === user.id);
    const formattedNews = news.map(news => ({
        ...news,
        time: formatTime(news.time)
    }));

    res.render('user', { user, users: data.users, news: formattedNews });
});

router.get('/users/:userId', (req, res) => {
    const userId = req.params.userId;
    const user = data.users.find(user => user.id === userId);

    if (user) {
        res.json(user);
    } else {
        Sentry.captureException({error: "Пользователь не найден"});
        res.status(404).json({ error: 'Пользователь не найден' });
    }
});

router.post('/users/update', (req, res) => {
    const { userId, name, email, role, status } = req.body;
    const userIndex = data.users.findIndex(user => user.id === Number(userId));

    if (userIndex !== -1) {
        data.users[userIndex].name = name;
        data.users[userIndex].email = email;
        data.users[userIndex].role = role;
        data.users[userIndex].status = status;
        fs.writeFileSync('users.json', JSON.stringify(data, null, 2));

        res.json({ success: true, message: 'Данные пользователя обновлены успешно.' });
    } else {
        res.status(404).json({ error: 'Пользователь не найден' });
    }
});

function formatTime(time) {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    };
    return new Date(time).toLocaleString('ru-RU', options);
}

function generateRandomId() {
    const existingIds = data.users.map(user => user.id);
    let randomId;

    do {
        randomId = Math.floor(Math.random() * 1000) + 1;
    } while (existingIds.includes(randomId));

    return randomId;
}

function generateRandomNewsId() {
    const existingIds = data.news.map(n => n.id);
    let randomId;

    do {
        randomId = Math.floor(Math.random() * 1000) + 1;
    } while (existingIds.includes(randomId));

    return randomId;
}

module.exports = router;
