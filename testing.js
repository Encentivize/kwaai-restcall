
var kwaaiRest=require('./lib/restcall.js')({
    headers:{"Content-Type": "application/json"},
    baseUrl:"http://api.openweathermap.org/data/2.5"

});


kwaaiRest.callRestService({

    url:"/weather?q={weatherQuery}",
    weatherQuery:"London,uk",
    verb:"get",
    headers:{"ttl":30}
},function(err,res){
    console.log(res);
})
