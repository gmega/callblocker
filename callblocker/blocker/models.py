from django.db import models


class Source(models.Model):
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=100)

    CID = 1
    USER = 2

    @staticmethod
    def predef_source(pk: int):
        return Source.objects.get(pk=pk)


class Caller(models.Model):
    # This may sound redundant but it's actually the best
    # primary key for our callers. Further, many other
    # pieces of the framework are not good at working with
    # composite keys, so having a single primary key makes
    # things much simpler.
    full_number = models.CharField(max_length=28, primary_key=True)

    area_code = models.CharField(max_length=8)
    number = models.CharField(max_length=20)
    date_inserted = models.DateTimeField(auto_now_add=True)
    last_call = models.DateTimeField(auto_now_add=True)

    block = models.BooleanField(default=False)

    source = models.ForeignKey(Source, on_delete=models.PROTECT)
    description = models.CharField(max_length=200, default='')
    notes = models.TextField(default='', blank=True)

    def save(self, *args, **kwargs):
        self.full_number = self.area_code.strip() + self.number.strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return '(%s) %s' % (self.area_code, self.number)


class Call(models.Model):
    # Beware of https://code.djangoproject.com/ticket/25012
    caller = models.ForeignKey(Caller, on_delete=models.CASCADE)
    time = models.DateTimeField()
    blocked = models.BooleanField()
