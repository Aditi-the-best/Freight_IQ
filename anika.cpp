#include <iostream>
#include <stack>
#include <string>
#include <cctype>
#include <sstream>

using namespace std;

bool isOperator(const string& token) {
    return token == "+" || token == "-" || token == "*" || token == "/";
}

string postfixToInfix(const string& postfix) {
    stack<string> s;
    stringstream ss(postfix);
    string token;

    while (ss >> token) {
        if (isOperator(token)) {
            if (s.size() < 2) {
                return "Invalid Postfix Expression";
            }
            string op2 = s.top(); s.pop();
            string op1 = s.top(); s.pop();
            
            string temp = "(" + op1 + " " + token + " " + op2 + ")";
            s.push(temp);
        } else {
            s.push(token);
        }
    }

    if (s.size() == 1) {
        return s.top();
    } else {
        return "Invalid Postfix Expression";
    }
}

int main() {
    string postfix = "10 20 * 5 +"; 
    cout << "Postfix: " << postfix << "\nInfix: " << postfixToInfix(postfix) << endl;
    return 0;
}
