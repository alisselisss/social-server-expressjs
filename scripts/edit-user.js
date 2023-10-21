$(document).ready(function () {
    $(document).on('show.bs.modal', '#editUserModal', function (event) {
        const userId = $(event.relatedTarget).attr('href').substring(1);

        $.ajax({
            type: 'GET',
            url: `/users/${userId}`,
            success: function (user) {
                $('#editUserId').val(user.id);
                $('#editUserName').val(user.name);
                $('#editUserEmail').val(user.email);
                $('#editUserRole').val(user.role);
                $('#editUserStatus').val(user.status);
            },
            error: function (error) {
                alert('Произошла ошибка при получении данных пользователя.');
                console.error(error);
            }
        });
    });

    $(document).on('submit', '#edit-user-form', function (event) {
        $("h5").text("Обрабатываю");
        event.preventDefault();

        let formData = $(this).serialize();

        $.ajax({
            type: 'POST',
            url: '/users/update',
            data: formData,
            success: function (response) {
                $('#editUserModal').modal('hide');
                location.reload();
            },
            error: function (error) {
                alert('Произошла ошибка при обновлении данных пользователя.');
                console.error(error);
            }
        });
    });
});