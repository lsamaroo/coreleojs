    //Register in the values from the outer closure for common dependencies
    //as local almond modules
    define('jquery', function () {
        return $;
    });
    define('lodash', function () {
        return _;
    });
    define('handlebars', function () {
        return Handlebars;
    });    
    

    //Use almond's special top-level, synchronous require to trigger factory
    //functions, get the final module value, and export it as the public
    //value.
    return require('coreleo');
}));
