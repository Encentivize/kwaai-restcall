var restClient = require('node-rest-client').Client;
var _options=null;

var service={

    callRestService:
        function(options,callback){
            return makeRestRequest(options,callback);
        }
}

module.exports=function(options){
    _options=options;
    return service;
}



function parseUrl(url,options){
    var baseUrl=_options.baseUrl;
    if (options.baseUrl){baseUrl=options.baseUrl}
    url = baseUrl+url;

    for (var k in options){
        url=url.replace("{" + k + "}",options[k])
    }
    return url;
}


function makeRestRequest(options,callback){
    var client=null;
    var args={};
    var options_auth=null;

    if (_options.headers){
        args.headers=_options.headers
    }
    if (options.headers){
        args.headers.concat(options.headers);
    }

    if (_options.auth){
        options_auth=_options.auth;
    }
    if (options.auth){
        options_auth=options.auth;
    }

    client=new restClient(options_auth);

    if (options.data){args.data=options.data;}


    function apiCalled(result,response){
        return parseResult(response.statusCode,result,callback);
    }

    var url=parseUrl(options.url,options);

    var retryCnt=5;
    function tryClient(){
        function errorRetry(err){
            console.log("retrying api call " + options.verb + ":" + url + ":" + retryCnt + ":" + JSON.stringify(err));
            if (retryCnt>0){
                retryCnt--;
                setTimeout(tryClient,5000);

            }
            else{
                return callback('Error connecting to api:' + options.verb + ":" + url + ":" + JSON.stringify(err));
            }
        }

        try{
            client[options.verb](url, args, apiCalled).on('error',function(err){
                errorRetry(err);
            })
        }
        catch(exp){
            errorRetry(exp);
        }
    }

    tryClient();
}



function parseResult(statusCode,result,callback){
    if (statusCode>=500){
        return callback(result);
    }
    else if (statusCode==204){
        return callback(null,null);
    }
    else if (statusCode>=200&&statusCode<300){
        if (result==""){return callback(null,null)}
        return callback(null,JSON.parse(result));
    }
    else if (statusCode==404){
        return callback(null,result);
    }
    else if (statusCode==401){
        return callback("Not Authorised",null);
    }
    else if (statusCode==400){
        var resError = "";
        if (result){
            var resError =JSON.stringify(result);
        }
        return callback("Bad Request" + resError,null);
    }
    else{
        return callback(null,null);
    }

}