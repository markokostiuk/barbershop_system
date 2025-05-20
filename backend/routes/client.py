from flask import Blueprint, render_template

client_bp = Blueprint('client', __name__)

@client_bp.route('/')
def select_city():
    return render_template('client/cities.html')

@client_bp.route('/branches')
def select_branch():
    return render_template('client/branches.html')

@client_bp.route('/book')
def book_appointment():
    return render_template('client/booking.html')