<?php
// routes/web.php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// routes/web.php
Route::get('/hora-servidor', function () {
    return now()->toDateTimeString();
});

