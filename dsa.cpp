#include <iostream>
using namespace std;
int main () {
    int n;
    cout<< "Enter number here:";
    cin>> n;
    int arr[n];
    cout<< "Enter "<< "n " << "elements:";
    for( int i=0; i<n; i++){
        cin>> arr[i];
    }
    int maxElem= arr[0];
    for (int i=1; i<n; i++){
        if (arr[i]> maxElem){
        maxElem =arr[i];}
        }
 cout<< "Maximum element:"<< maxElem<< endl;
 return 0;
}

