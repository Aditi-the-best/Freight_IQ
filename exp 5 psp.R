x<- c(0,7,8,6)
px <- c(0.1,0.2,0.4, 0.3)
if (sum(px) !=1){
  stop ("Probabilties must sum to be equal to 1")
}
expected_value= sum(x*px)
expected_value= sum(x*px)
cat ("Expected value E(X):", expected_value, "\n")
expected_value_squared= sum((x^2)*px)
variance<- expected_value_squared- (expected_value^2)
cat ("Variance Var(x):", variance, "\n")
LargeSample<- sample(x, size=100, prob= px, replace=TRUE)
if (sum (px)!= 1){
  stop ("Probabilties must sum to be equal to 1")
}
v= var(LargeSample)
v
m= mean (LargeSample)
m
PDF_Uniform<- function(x){
  ifelse (x>=0& x<=1,1,0)
}
expected_value<- integrate (function(x) x*PDF_Uniform(x),0,1)$value
cat("The expected value E(X):", expected_value, "\n")
ev_squared= integrate( function(x) (x^2) *PDF_Uniform(x),0,1)$value
Variance<- ev_squared- ((expected_value)^2)
cat("The Variance Var(x):", variance, "\n")