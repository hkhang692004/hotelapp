echo "=== cài đặt thư viện từ requirements.txt ==="
pip install -r requirements.txt

echo "=== Thực thi migrate cơ sở dữ liệu ==="
python manage.py migrate

echo "=== Tạo superuser ==="
export DJANGO_SUPERUSER_USERNAME=admin
export DJANGO_SUPERUSER_EMAIL=admin@example.com
export DJANGO_SUPERUSER_PASSWORD=Admin@123

python manage.py createsuperuser --no-input || echo "SuperUser đã tồn tại!"

echo "=== Chèn dữ liệu mẫu ==="
python manage.py shell  <<EOF
from courses.models import Category, Course, Tag, Lesson, Comment

c1, _ = Category.objects.get_or_create(name='Software Engineering')
c2, _ = Category.objects.get_or_create(name='Artificial Intelligence')
c3, _ = Category.objects.get_or_create(name='Data Sciences')

co1 = Course.objects.create(subject='Introduction to SE', description='demo', image='https://res.cloudinary.com/dxxwcby8l/image/upload/v1709564625/feofvm4kpodv2nhrddru.png', category=c1)
co2 = Course.objects.create(subject='Software Testing', description='demo', image='https://res.cloudinary.com/dxxwcby8l/image/upload/v1709565062/rohn1l6xtpxedyqgyncs.png', category=c1)
co3 = Course.objects.create(subject='Introduction to AI', description='demo', image='https://res.cloudinary.com/dxxwcby8l/image/upload/v1709630366/yc4imfbm19napfehbcai.jpg', category=c2)
co4 = Course.objects.create(subject='Machine Learning', description='demo', image='https://res.cloudinary.com/dxxwcby8l/image/upload/v1709565062/rohn1l6xtpxedyqgyncs.png', category=c1)
co5 = Course.objects.create(subject='Deep Learning', description='demo', image='https://res.cloudinary.com/dxxwcby8l/image/upload/v1709565672/vk0boxfs3uvhwckcnioq.png', category=c1)
co6 = Course.objects.create(subject='Python Programming', description='demo', image='https://res.cloudinary.com/dxxwcby8l/image/upload/v1709565062/rohn1l6xtpxedyqgyncs.png', category=c3)
co7 = Course.objects.create(subject='Software Architecture', description='demo', image='https://res.cloudinary.com/dxxwcby8l/image/upload/v1709565128/psev7ddpwaatfro7sdb8.png', category=c1)
co8 = Course.objects.create(subject='Natural Language Processing', description='demo', image='https://res.cloudinary.com/dxxwcby8l/image/upload/v1709646926/eb9sdsta698n3y4ttcy7.png', category=c2)
co11 = Course.objects.create(subject='Introduction to SE', description='demo', image='https://res.cloudinary.com/dxxwcby8l/image/upload/v1709564625/feofvm4kpodv2nhrddru.png', category=c1)
co12 = Course.objects.create(subject='Advanced Software Testing', description='demo', image='https://res.cloudinary.com/dxxwcby8l/image/upload/v1709565062/rohn1l6xtpxedyqgyncs.png', category=c1)
co13 = Course.objects.create(subject='AI Techniques', description='demo', image='https://res.cloudinary.com/dxxwcby8l/image/upload/v1709630366/yc4imfbm19napfehbcai.jpg', category=c2)
co14 = Course.objects.create(subject='SE for Machine Learning', description='demo', image='https://res.cloudinary.com/dxxwcby8l/image/upload/v1709565062/rohn1l6xtpxedyqgyncs.png', category=c1)
co15 = Course.objects.create(subject='Transfer Learning', description='demo', image='https://res.cloudinary.com/dxxwcby8l/image/upload/v1709565672/vk0boxfs3uvhwckcnioq.png', category=c1)
co16 = Course.objects.create(subject='Advanced Python Programming', description='demo', image='https://res.cloudinary.com/dxxwcby8l/image/upload/v1709565062/rohn1l6xtpxedyqgyncs.png', category=c3)
co17 = Course.objects.create(subject='Software Architecture Design', description='demo', image='https://res.cloudinary.com/dxxwcby8l/image/upload/v1709565128/psev7ddpwaatfro7sdb8.png', category=c1)
co18 = Course.objects.create(subject='Advanced AI', description='demo', image='https://res.cloudinary.com/dxxwcby8l/image/upload/v1709646926/eb9sdsta698n3y4ttcy7.png', category=c2)

t1, _ = Tag.objects.get_or_create(name='techniques')
t2, _ = Tag.objects.get_or_create(name='software')
t3, _ = Tag.objects.get_or_create(name='programming')

l1 = Lesson.objects.create(subject='SE Overview', content='Demo', image='https://res.cloudinary.com/dxxwcby8l/image/upload/v1709565062/rohn1l6xtpxedyqgyncs.png', course=co1)
l1.tags.add(t1)
l1.tags.add(t2)
l1.save()
l2 = Lesson.objects.create(subject='Software Analysis', content='Demo', image='https://res.cloudinary.com/dxxwcby8l/image/upload/v1709565062/rohn1l6xtpxedyqgyncs.png', course=co1)
l2.tags.add(t2)
l2.tags.add(t3)
l2.save()
l3 = Lesson.objects.create(subject='Software Design', content='Demo', image='https://res.cloudinary.com/dxxwcby8l/image/upload/v1709565062/rohn1l6xtpxedyqgyncs.png', course=co1)
l3.tags.add(t1)
l3.tags.add(t2)
l3.tags.add(t3)
l3.save()
l4 = Lesson.objects.create(subject='Black-box Testing', content='Demo', image='https://res.cloudinary.com/dxxwcby8l/image/upload/v1709565062/rohn1l6xtpxedyqgyncs.png', course=co2)
l5 = Lesson.objects.create(subject='White-box Testing', content='Demo', image='https://res.cloudinary.com/dxxwcby8l/image/upload/v1709565062/rohn1l6xtpxedyqgyncs.png', course=co2)

u1 = User.objects.create_user(first_name='Thanh', last_name='Duong', email='dhthanhqa@gmail.com', username='dhthanh', password='123456')
u2 = User.objects.create_user(first_name='Alex', last_name='Duong', email='dhthanhit@gmail.com', username='thanhduong', password='123456')

Comment.objects.create(lesson=l1, user=u1, content='Good')
Comment.objects.create(lesson=l1, user=u2, content='Excellent')
Comment.objects.create(lesson=l1, user=u1, content='That is great!')
Comment.objects.create(lesson=l2, user=u1, content='This is so great')
Comment.objects.create(lesson=l2, user=u2, content='Wonderful')
Comment.objects.create(lesson=l1, user=u1, content='Great lesson!')
Comment.objects.create(lesson=l1, user=u2, content='Very helpful, thanks!')
Comment.objects.create(lesson=l1, user=u2, content='I learned a lot')
Comment.objects.create(lesson=l1, user=u1, content='Clear explanation')
Comment.objects.create(lesson=l2, user=u1, content='Nice examples')
Comment.objects.create(lesson=l2, user=u1, content='Easy to understand')
Comment.objects.create(lesson=l3, user=u1, content='Well structured content')
Comment.objects.create(lesson=l3, user=u2, content='This is amazing')
Comment.objects.create(lesson=l1, user=u1, content='Helpful for beginners')
Comment.objects.create(lesson=l1, user=u2, content='Looking forward to more lessons')
Comment.objects.create(lesson=l1, user=u1, content='Awesome!')
Comment.objects.create(lesson=l1, user=u1, content='Pretty useful')
Comment.objects.create(lesson=l1, user=u1, content='Nice work')
Comment.objects.create(lesson=l1, user=u1, content='Good explanation')
Comment.objects.create(lesson=l1, user=u1, content='Very clear')
Comment.objects.create(lesson=l1, user=u1, content='I like this lesson')
Comment.objects.create(lesson=l1, user=u1, content='Helpful content')
Comment.objects.create(lesson=l1, user=u1, content='Great job!')
Comment.objects.create(lesson=l1, user=u1, content='Well done')
Comment.objects.create(lesson=l2, user=u1, content='Easy to follow')
Comment.objects.create(lesson=l1, user=u2, content='Straight to the point')
Comment.objects.create(lesson=l1, user=u1, content='Useful tips')
Comment.objects.create(lesson=l3, user=u2, content='Loved it')
Comment.objects.create(lesson=l3, user=u1, content='Simple and clear')
Comment.objects.create(lesson=l1, user=u2, content='Very informative')
Comment.objects.create(lesson=l1, user=u1, content='Good for practice')
Comment.objects.create(lesson=l1, user=u2, content='Helpful examples')
Comment.objects.create(lesson=l1, user=u1, content='Nicely explained')
Comment.objects.create(lesson=l1, user=u2, content='Great content')
Comment.objects.create(lesson=l1, user=u1, content='Thanks for sharing')

EOF

echo "=== Chạy server Django ==="
python manage.py runserver