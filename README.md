#kwaai-restcall

Node helpers to call restful JSON API's


```javascript
var kwaaiRest=require("kwaai-restcall")(
    {headers:{"Content-Type": "application/json"},
    baseUrl:"http://api.openweathermap.org/data/2.5"
});

kwaaiRest.callRestService({
    url:"/weather?q={weatherQuery}",
    weatherQuery:"London,uk",
    verb:"get"
    },function(err,res){
    console.log(res);
})

```