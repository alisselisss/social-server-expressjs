$(document).ready((function(){$('[id^="blockNewsButton"]').on("click",(function(){!function(n){$.ajax({type:"POST",url:"/news/block/".concat(n),success:function(n){location.reload()},error:function(n){alert("Error blocking news: "+n)}})}($(this).data("id"))})),$('[id^="activateNewsButton"]').on("click",(function(){!function(n){$.ajax({type:"POST",url:"/news/activate/".concat(n),success:function(n){location.reload()},error:function(n){alert("Error activating news: "+n)}})}($(this).data("id"))}))}));