var restClient = require('node-rest-client').Client;
var deepcopy=require("deepcopy");

module.exports=function(globalOptions) {
    return new restService(globalOptions);
}

function restService(globalOptions) {
    var self=this;

    var copiedGlobalOptions=deepcopy(globalOptions);

    self.callRestService=function(options, callback) {
        var copiedOptions = deepcopy(options)

        var baseUrl = "";
        if (copiedGlobalOptions.baseUrl) {
            baseUrl = copiedGlobalOptions.baseUrl;
        }
        if (options.baseUrl) {
            baseUrl = options.baseUrl
        }
        copiedOptions.baseUrl = baseUrl;

        var headers = {}
        if (copiedGlobalOptions.headers) {
            headers = deepcopy(copiedGlobalOptions.headers);
        }
        if (options.headers) {
            extend(headers, options.headers);
        }
        copiedOptions.headers = headers;

        var auth = null;
        if (copiedGlobalOptions.auth) {
            auth = deepcopy(copiedGlobalOptions.auth);
        }
        if (options.auth) {
            auth = options.auth
        }
        ;
        copiedOptions.auth = auth;

        return makeRestRequest(copiedOptions, callback);
    }
}


function parseUrl(url,options){
    url = options.baseUrl+url;

    for (var k in options){
        url=url.replace("{" + k + "}",options[k])
    }
    return url;
}

/*
base options
@baseUrl: url to prepend to the url. Override global options baseUrl
@url:url to call with prepended baseUrl if supplied. Any {param} values are replaced with the same name in options.
@verb: post, get, put,patch, delete,options
@auth: {username,password} basic http auth. Overrides global auth
@data: data to send
@headers: any headers to merge with global headers.
 */

function makeRestRequest(options,callback){
    var client=null;
    var args={headers:{}};
    var options_auth=null;

    if (options.headers){
        args.headers=options.headers;
    }

    if (options.auth){
        options_auth=options.auth;
    }

    client=new restClient(options_auth);
    client.on('error',function(err){
        console.error('Something went wrong on the client', err);
    });

    if (options.data){args.data=options.data;}


    function apiCalled(result,response){
        return parseResult(response,result,callback);
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
                console.error("Error connecting to api",err);
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


function parseResult(response,result,callback){
    if (response.statusCode>=500){
        return callback(result);
    }
    else if (response.statusCode==204){
        return callback(null,null);
    }
    else if (response.statusCode==202){
        var resLocation=null;
        if (response.headers&&response.headers.location){
            resLocation=response.headers.location;
        }else if (response.headers&&response.Location){
            resLocation=response.headers.Location;
        }
        return callback(null,resLocation);
    }
    else if (response.statusCode>=200&&response.statusCode<300){
        if (result==""){return callback(null,null)}
        var parsedResult=null;
        try{
            parsedResult=JSON.parse(result);
        }catch(exp){
            parsedResult=result;
        }
        return callback(null,parsedResult);
    }
    else if (response.statusCode==404){
        var resError = "";
        if (result){
            var resError =JSON.stringify(result);
        }
        return callback("Not Found:" + resError,null);
    }
    else if (response.statusCode==401){
        var resError = "";
        if (result){
            var resError =JSON.stringify(result);
        }
        return callback("Not Authorised:" + resError,null);
    }
    else if (response.statusCode==400){
        var resError = "";
        if (result){
            var resError =JSON.stringify(result);
        }
        return callback("Bad Request:" + resError,null);
    }
    else{
        return callback(null,null);
    }

}

function extend(a, b){
    for(var key in b)
        if(b.hasOwnProperty(key))
            a[key] = b[key];
    return a;
}