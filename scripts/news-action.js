function blockNews(newsId){
    $.ajax({
        type: 'POST',
        url: `/news/block/${newsId}`,
        success: function (response) {
            location.reload();
        },
        error: function (error) {
            alert('Error blocking news: ' +  error);
        }
    });
}

function activateNews(newsId) {
    $.ajax({
        type: 'POST',
        url: `/news/activate/${newsId}`,
        success: function (response) {
            location.reload();
        },
        error: function (error) {
            alert('Error activating news: ' + error);
        }
    });
}

$(document).ready(function () {
    $('[id^="blockNewsButton"]').on('click', function() {
        const newsId = $(this).data('id');
        blockNews(newsId);
    });

    $('[id^="activateNewsButton"]').on('click', function() {
        const newsId = $(this).data('id');
        activateNews(newsId);
    });
});

