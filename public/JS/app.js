// -------------------------------
// ** FIREBASE CONFIG ** 
// -------------------------------

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBz9ucdMV7rIpEid4PoUFZ-7RcX3mKFMWg",
    authDomain: "chess-bfb04.firebaseapp.com",
    projectId: "chess-bfb04",
    storageBucket: "chess-bfb04.firebasestorage.app",
    messagingSenderId: "771678275960",
    appId: "1:771678275960:web:4f6634d804e0c890e5a08d",
    measurementId: "G-HK1HY6M261"
};

// DOM ELEMENTS
const loggedOutLinks = document.querySelectorAll('.logged-out');
const loggedInLinks = document.querySelectorAll('.logged-in');
let userID = null;
var userData;

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Auth management popup listeners ----------------------------------------------------
document.getElementById('login-navbtn').addEventListener('click', function() {
    console.log("Login button clicked");
    const loginPopup = document.querySelector('.login-popup');
    loginPopup.style.display = 'block';
});

document.getElementById('signup-navbtn').addEventListener('click', function() {
    console.log("Login button clicked");
    const signupPopup = document.querySelector('.signup-popup');
    signupPopup.style.display = 'block';
});

document.getElementById('profile-navbtn').addEventListener('click', async function() {
    const profilePopup = document.querySelector('.profile-popup');
    profilePopup.style.display = 'block';

    try {
        // Fetch and display user stats
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();

        if (userData) {
            document.getElementById('userEmail').textContent = `Email: ${auth.currentUser.email}`;
            document.getElementById('userWins').textContent = `Wins: ${userData.stats.wins}`;
            document.getElementById('userLosses').textContent = `Losses: ${userData.stats.losses}`;
            document.getElementById('userDraws').textContent = `Draws: ${userData.stats.draws}`;
            document.getElementById('userWinRate').textContent = `Win Rate: ${userData.stats.winRate.toFixed(1)}%`;

            // Display match history
            const matchHistoryList = document.getElementById('matchHistoryList');
            matchHistoryList.innerHTML = '';

            const recentMatches = userData.matchHistory.slice(-10).reverse(); // Show last 10 matches
            recentMatches.forEach(match => {
                const matchEntry = document.createElement('div');
                matchEntry.className = `match-entry ${match.result}`;
                const date = new Date(match.timestamp);
                
                // Create a collapsible section for PGN notation
                const pgnSection = match.pgn ? `
                    <div class="pgn-section">
                        <div class="pgn-buttons">
                            <button class="pgn-toggle">Show PGN</button>
                            <button class="pgn-copy">Copy PGN</button>
                        </div>
                        <div class="pgn-content" style="display: none;">
                            <pre>${match.pgn}</pre>
                        </div>
                    </div>
                ` : '';
                
                matchEntry.innerHTML = `
                    <div>Result: ${match.result.toUpperCase()}</div>
                    <div>Opponent: ${match.opponent}</div>
                    <div>Date: ${date.toLocaleDateString()}</div>
                    ${pgnSection}
                `;
                matchHistoryList.appendChild(matchEntry);
                
                // Add event listener for PGN toggle button if it exists
                const pgnToggle = matchEntry.querySelector('.pgn-toggle');
                if (pgnToggle) {
                    pgnToggle.addEventListener('click', function() {
                        const pgnContent = this.closest('.pgn-section').querySelector('.pgn-content');
                        if (pgnContent.style.display === 'none') {
                            pgnContent.style.display = 'block';
                            this.textContent = 'Hide PGN';
                        } else {
                            pgnContent.style.display = 'none';
                            this.textContent = 'Show PGN';
                        }
                    });
                }
                
                // Add event listener for PGN copy button if it exists
                const pgnCopy = matchEntry.querySelector('.pgn-copy');
                if (pgnCopy) {
                    pgnCopy.addEventListener('click', function() {
                        navigator.clipboard.writeText(match.pgn)
                            .then(() => {
                                const originalText = this.textContent;
                                this.textContent = 'Copied!';
                                setTimeout(() => {
                                    this.textContent = originalText;
                                }, 2000);
                            })
                            .catch(err => {
                                console.error('Failed to copy PGN: ', err);
                                alert('Failed to copy PGN to clipboard');
                            });
                    });
                }
            });
        }
    } catch (error) {
        console.error("Error loading profile data:", error);
        alert("Error loading profile data. Please try again.");
    }
});

document.getElementById('close-login-popup').addEventListener('click', function() {
    const loginPopup = document.querySelector('.login-popup');
    loginPopup.style.display = 'none';
});

document.getElementById('close-signup-popup').addEventListener('click', function() {
    const signupPopup = document.querySelector('.signup-popup');
    signupPopup.style.display = 'none';
});

document.getElementById('close-profile-popup').addEventListener('click', function() {
    const loginPopup = document.querySelector('.profile-popup');
    loginPopup.style.display = 'none';
});

// ======================================== ACCOUNT MANAGEMENT ========================================
// Signup =============================================================================================
const signupForm = document.querySelector('#signup-form');
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = signupForm['signup-email'].value;
  const password = signupForm['signup-password'].value;
  const username = signupForm['signup-username'].value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Initialize user stats with username
    const userStatsRef = doc(db, 'users', user.uid);
    await setDoc(userStatsRef, {
      username: username,
      email: email,
      stats: {
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0
      },
      matchHistory: []
    });

    signupForm.reset();
    document.querySelector('.signup-popup').style.display = 'none';
    console.log("User Created and Stats Initialized");
  } catch (error) {
    console.error("Error creating user:", error);
    alert("Error creating account. Please try again.");
  }
});

// Login ==============================================================================================
const loginForm = document.querySelector('#login-form');
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const email = loginForm['login-email'].value;
  const password = loginForm['login-password'].value;

  signInWithEmailAndPassword(auth, email, password).then((cred) => {
    loginForm.reset();
    document.querySelector('.login-popup').style.display = 'none';
  });


});
  
// Logout =============================================================================================
const logout = document.getElementById('signout-navbtn');
logout.addEventListener('click', (e) => {
  console.log("User Logged Out");
  e.preventDefault();
  auth.signOut();
  window.location.reload();
});

// Login Status ======================================================================================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log(user);
    userID = user.uid;
    console.log(userID);
    loggedInLinks.forEach(item => item.style.display = 'block');
    loggedOutLinks.forEach(item => item.style.display = 'none');
    console.log("Before update:", document.getElementById('userEmail').innerText);
    document.getElementById('userEmail').innerText = `Email: ${user.email}`;
    console.log("After update:", document.getElementById('userEmail').innerText);
    
    // Update the login status message when user is logged in
    const loginStatusMessage = document.getElementById('login-status-message');
    if (loginStatusMessage) {
      loginStatusMessage.textContent = "You are signed in, tracking stats and game history.";
    }
} 
  else {
    userID = null;
    loggedInLinks.forEach(item => item.style.display = 'none');
    loggedOutLinks.forEach(item => item.style.display = 'block');
    console.log("User Logged Out");
    
    // Reset login status message to guest mode
    const loginStatusMessage = document.getElementById('login-status-message');
    if (loginStatusMessage) {
      loginStatusMessage.textContent = "You are in guest mode. Sign in to save history and stats.";
    }
  }
});

// -------------------------------
// ** DOM CONTENT INIT ** 
// -------------------------------

document.addEventListener('DOMContentLoaded', async () => {
    const game = new Chess();
    console.log(game);
    const board = Chessboard('board', {
        position: 'start',
        draggable: true,
        onDrop: handleMove,
        onDragStart: onDragStart,
    });
    var $board = $('#board')
    var squareToHighlight = null
    var squareClass = 'square-55d63'
    $(window).resize(board.resize)

    let gameId = null;
    let playerColor = null;
    let gameRef = null;
    let chatRef = null;

    // initialization buttons
    const joinInput = document.getElementById('join-id-input');
    const joinPwInput = document.getElementById('join-pw-input');
    const joinButton = document.getElementById('join-send');
    const hostPwInput = document.getElementById('host-pw-input');
    const hostButton = document.getElementById('host-send');
    const reloadButton = document.getElementById('reload-button');
    
    // sidebar elements
    const chatMessages = document.getElementById('chat-messages')
    const moveList = document.getElementById('move-list');
    const gameIDElement = document.getElementById('game-id');

    // meta UI state management
    const UIBeforeGame = document.querySelectorAll('.beforegame');
    const UIDuringGame = document.querySelectorAll('.duringgame');
    const UIAfterGame = document.querySelectorAll('.aftergame');

    // -------------------------------
    // ** UI AND GAME FLOW MANAGEMENT ** 
    // -------------------------------

    hostButton.addEventListener('click', async () => {
        const hostPassword = hostPwInput.value.trim();
        if (!hostPassword) {
            alert('Please enter a password to host the game.');
            return;
        }

        // Get current user's username
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        const username = userData.username;

        gameId = Math.random().toString(36).substr(2, 9);
        gameIDElement.innerHTML = gameId;
        gameRef = doc(db, 'games', gameId);

        await setDoc(gameRef, {
            moves: [],
            pgn: '',
            turn: 'w',
            players: { host: hostPassword, hostUsername: username, join: null, joinUsername: null },
            gameOver: false,
            messages: []
        });

        playerColor = 'w';
        setupSnapshotListener();
        UIBeforeGame.forEach(item => item.style.display = 'none');
        UIDuringGame.forEach(item => item.style.display = 'block');
        UIAfterGame.forEach(item => item.style.display = 'none');
    });

    joinButton.addEventListener('click', async () => {
        const joinId = joinInput.value.trim();
        const joinPassword = joinPwInput.value.trim();

        if (!joinId || !joinPassword) {
            alert('Please enter the Game ID and password.');
            return;
        }

        gameRef = doc(db, 'games', joinId);
        const gameSnapshot = await getDoc(gameRef);

        if (!gameSnapshot.exists()) {
            alert('Game not found!');
            return;
        }

        const gameData = gameSnapshot.data();
        if (gameData.players.join) {
            alert('Game is already full!');
            return;
        }

        if (gameData.players.host !== joinPassword) {
            alert('Incorrect password!');
            return;
        }

        // Get current user's username
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        const username = userData.username;

        gameId = joinId;
        playerColor = 'b';
        gameIDElement.innerHTML = joinId;

        await updateDoc(gameRef, {
            'players.join': 'joined',
            'players.joinUsername': username
        });

        setupSnapshotListener();
        UIBeforeGame.forEach(item => item.style.display = 'none');
        UIDuringGame.forEach(item => item.style.display = 'block');
        UIAfterGame.forEach(item => item.style.display = 'none');
    });

    // -------------------------------
    // ** FIREBASE SHARED GAME STATE MANAGEMENT ** 
    // -------------------------------

    async function updateGameState(state) {
        if (gameRef) {
            await updateDoc(gameRef, state);
        }
    }

    function setupSnapshotListener() {
        if (!gameRef) {
            console.error('Game reference not set.');
            return;
        }

        onSnapshot(gameRef, (doc) => {
            if (doc.exists()) {
                console.log('Snapshot triggered:', doc.data());
                const data = doc.data();
                const moves = data.moves || [];

                game.reset();
                moves.forEach((move) => game.move(move));
                board.position(game.fen());

                // Update move list with PGN notation
                if (moveList) {
                    moveList.innerHTML = '';
                    const pgnMoves = game.pgn().split(' ');
                    
                    // Create a formatted move list with move numbers
                    let moveNumber = 1;
                    let moveText = '';
                    
                    for (let i = 0; i < pgnMoves.length; i++) {
                        if (i % 2 === 0) {
                            // White's move
                            moveText += `<div class="move-entry"><span class="move-number">${moveNumber}.</span> <span class="white-move">${pgnMoves[i]}</span>`;
                        } else {
                            // Black's move
                            moveText += ` <span class="black-move">${pgnMoves[i]}</span></div>`;
                            moveNumber++;
                        }
                    }
                    
                    // Handle case where there's an odd number of moves (game in progress)
                    if (pgnMoves.length % 2 === 1) {
                        moveText += '</div>';
                    }
                    
                    moveList.innerHTML = moveText;
                }

                const turnDisplay = document.getElementById('turn');
                if (turnDisplay) {
                    turnDisplay.innerText = data.turn === 'w' ? 'White' : 'Black';
                }
                
                chatMessages.innerHTML = '';

                data.messages.forEach((message) => {
                    const li = document.createElement('li');
                    li.className = message.sender;
                    li.textContent = `${message.sender === 'w' ? 'White' : 'Black'}: ${message.text}`;
                    chatMessages.appendChild(li);
                });
                
                const chatWindow = document.getElementById('chat-window');
                chatWindow.scrollTop = chatWindow.scrollHeight;

                if (data.gameOver == true) {
                    UIBeforeGame.forEach(item => item.style.display = 'none');
                    UIDuringGame.forEach(item => item.style.display = 'none');
                    UIAfterGame.forEach(item => item.style.display = 'block');

                    if (data.gameWinner) {
                        if (data.gameWinner === playerColor) {
                            document.getElementById('winner-output').style.display = 'block';
                        } else {
                            document.getElementById('loser-output').style.display = 'block';
                        }
                    } else {
                        document.getElementById('draw-output').style.display = 'block';
                    }
                }
            } else {
                console.error('Document does not exist.');
            }
        });
    }

    // -------------------------------
    // ** CHESSBOARD INTERACTION ** 
    // -------------------------------

    async function handleMove(source, target) {
        removeHighlights('black');
        removeHighlights('white');

        if (game.turn() !== playerColor) return 'snapback';

        const move = game.move({ from: source, to: target, promotion: 'q' });
        if (move === null) {
            alert('Illegal move, move the piece back to its original position.');
            return 'snapback';
        }

        // Determine game state and message
        let gameOver = false;
        let gameWinner = null;
        let result = 'draw';

        if (game.in_checkmate()) {
            gameOver = true;
            gameWinner = playerColor;
            result = playerColor === 'w' ? 'win' : 'loss';
        } else if (game.in_draw()) {
            gameOver = true;
        } else if (game.in_stalemate()) {
            gameOver = true;
        }

        // Update the game state
        await updateGameState({
            moves: game.history(),
            pgn: game.pgn(),
            turn: game.turn(),
            gameOver,
            gameWinner
        });

        // If game is over, update player stats
        if (gameOver) {
            try {
                const userRef = doc(db, 'users', auth.currentUser.uid);
                const userDoc = await getDoc(userRef);
                const userData = userDoc.data();
                
                // Get opponent info from game data
                const gameDoc = await getDoc(gameRef);
                const gameData = gameDoc.data();
                const opponentUsername = playerColor === 'w' ? 
                    gameData.players.joinUsername : 
                    gameData.players.hostUsername;

                // Update stats based on game result
                const stats = userData.stats || { wins: 0, losses: 0, draws: 0, winRate: 0 };
                if (result === 'win') {
                    stats.wins++;
                } else if (result === 'loss') {
                    stats.losses++;
                } else {
                    stats.draws++;
                }
                
                // Calculate new win rate
                const totalGames = stats.wins + stats.losses + stats.draws;
                stats.winRate = totalGames > 0 ? (stats.wins / totalGames) * 100 : 0;

                // Add to match history with PGN notation
                const matchHistory = userData.matchHistory || [];
                matchHistory.push({
                    opponent: opponentUsername,
                    result: result,
                    timestamp: Date.now(),
                    gameId: gameId,
                    pgn: gameData.pgn || ''
                });

                // Update user document
                await updateDoc(userRef, {
                    stats: stats,
                    matchHistory: matchHistory
                });
            } catch (error) {
                console.error("Error updating user stats:", error);
            }
        }
    }

    function onDragStart(source, piece, position, orientation) {
        removeHighlights('black');
        removeHighlights('white');

        if (
            (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (game.turn() === 'b' && piece.search(/^w/) !== -1)
        ) {
            return false;
        }

        var legalMoves = game.moves({
            square: source,
            verbose: true,
        });

        legalMoves.forEach((move) => {
            $board.find('.square-' + move.to).addClass('highlight-legal');
        });
    }

    // -------------------------------
    // ** UTILITY FUNCTIONS ** 
    // -------------------------------

    function removeHighlights(color) {
        $board.find('.' + squareClass).removeClass('highlight-' + color);
        $board.find('.' + squareClass).removeClass('highlight-legal');
    }

    document.getElementById('chat-send').addEventListener('click', async () => {
        const input = document.getElementById('message-input');
        const messageText = input.value.trim();
        if (messageText) {
            const message = {
                sender: playerColor,
                text: messageText
            };

            const gameSnapshot = await getDoc(gameRef);
            const data = gameSnapshot.data();

            await updateDoc(gameRef, {
                messages: [...data.messages, message]
            });

            input.value = '';
        }
    });
});