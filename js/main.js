function debounce(t,e,o){var i;return function(){var n=this,s=arguments,c=function(){i=null,o||t.apply(n,s)},l=o&&!i;clearTimeout(i),i=setTimeout(c,e),l&&t.apply(n,s)}}function backToTop(t){if(0!==$("h3").length){var e=$(document).height()/4;$(window).scroll(function(){$(this).scrollTop()>e?btt.show():btt.hide()}),btt.click(function(){$("html, body").animate({scrollTop:0},"fast",function(){$(this).finish()})})}}function draw(){sb.toggle("slide",{direction:"left"},"fast"),overlay(),toggle()}function overlay(){"hidden"===ol.css("visibility")?(ol.css({visibility:"visible",opacity:0}).animate({opacity:1},"fast"),ol.on("click",function(){draw()}),b.css("overflow-y","hidden")):(ol.css({visibility:"hidden",opacity:1}).animate({opacity:0},"fast"),ol.off("click"),b.css("overflow-y","auto"))}function toggle(){var t="fa-ellipsis-",e="fas "+i,o=t+"h",i=t+"v";ic.attr("class")===e?ic.toggleClass(i+" "+o):ic.toggleClass(o+" "+i)}function stopScroll(t){!0===t?b.on("touchmove",function(t){t.preventDefault(),t.stopPropagation()}):b.off("touchmove")}var btt=$(".back-to-top"),sb=$(".sidebar"),mn=$(".menu"),btn=$(".btn"),ph=$(".post-header"),fi=$(".feature-image"),no=$(".notice"),ol=$(".overlay"),b=$("body"),ic=mn.find("i");$(document).ready(function(){backToTop($(window).width()),mn.click(function(){draw()}),$("#results-container").on("DOMNodeInserted","li",function(t){var e=$("#results-container li"),o=e.length,i=0,n=0;$("#search-input").on("keydown",function(t){38!=t.keyCode&&40!=t.keyCode||t.preventDefault()}),$("#search-input").on("keyup",function(t){var s=t.which;40==s?(n++,1===n&&0===i?e.eq(i).css("background","#eee").siblings().removeAttr("style"):(i++,i%=o,e.eq(i).css("background","#eee").siblings().removeAttr("style"))):38==s?(i--,-1===i&&(i=o-1),e.eq(i).css("background","#eee").siblings().removeAttr("style")):13==s&&e.eq(i).children().get(0).click()}),$("#results-container li").on("mouseover",function(t){$(this).css("cursor","pointer"),$(this).css("background","#eee").siblings().removeAttr("style"),i=$(this).index(),n++}),$("#results-container li").on("click",function(t){$(this).children().get(0).click()})})}),$(window).resize(debounce(function(){backToTop($(window).width()),"none"==sb.css("display")&&sb.removeAttr("style")},500));